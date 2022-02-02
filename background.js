const logger = console;

const CLIENT_ID = 'b3fdb0a2-b19b-4e14-b6ec-562d15089bb7';
const REDIRECT_URI = chrome.identity.getRedirectURL();
const RESPONSE_TYPE = 'code';
const OWNER = 'user';
const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';
const AUTH_CREDENTIAL = 'YjNmZGIwYTItYjE5Yi00ZTE0LWI2ZWMtNTYyZDE1MDg5YmI3OnNlY3JldF9hd3ljUGxiSDZoMklISjNETVRVeGFiYzhTc2NRVXQybGVhVEpybHpoNEFx';
const GRANT_TYPE = 'authorization_code';

async function completeAuth(redirectUrl) {
  const query = redirectUrl.split('?')[1];
  const code = new URLSearchParams(query).get('code');
  if (!code) throw new Error('No code found in redirect URL.');

  logger.debug(`Fetching access token for code ${code}`);
  
  const headers = new Headers();
  headers.append("Authorization", `Basic ${AUTH_CREDENTIAL}`);
  headers.append("Content-Type", "application/x-www-form-urlencoded");

  const body = new URLSearchParams();
  body.append("grant_type", GRANT_TYPE);
  body.append("code", code);
  body.append("redirect_uri", REDIRECT_URI);

  const requestOptions = {
    method: 'POST',
    headers,
    body,
  };

  const response = await fetch("https://api.notion.com/v1/oauth/token", requestOptions)
    .catch(err => {
      console.error(err);
    });

  const responseJson = await response.json();

  // The stored code is no longer valid, so clear it. Or there is some other issue and we should try again.
  if (responseJson.error) {
    if (responseJson.error === 'invalid_grant') chrome.storage.sync.set({ redirectUrl: null });
    else throw new Error(responseJson.error);
  }

  logger.debug('Successfully retrieved access token.');

  return new Promise((resolve) => {
    chrome.storage.sync.set({
      accessToken: responseJson.access_token,
      user: responseJson.owner.user,
    }, () => {
      logger.debug('Successfully stored access token.');
      resolve(responseJson.access_token);
    });
  });
}

async function startAuth() {
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&owner=${OWNER}`;
  
  logger.debug('launchWebAuthFlow', authUrl);
  
  return new Promise((resolve, reject) => {
    try {
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, async (redirectUrl) => {
        logger.debug('launchWebAuthFlow login successful: ', redirectUrl);

        const accessToken = await completeAuth(redirectUrl);
        resolve(accessToken);
      });
    } catch (error) {
      logger.error('Error while starting auth.', error);
      reject(error);
    }
  });
}

function logOut() {
  logger.debug('Logging out');
  chrome.storage.sync.set({
    accessToken: null,
    cursor: null,
    user: null,
  });
}

async function init() {
  logger.debug('Initializing background script');

  const storage = await chrome.storage.sync.get();
  logger.debug('Storage: ', storage);

  const accessToken = storage.accessToken;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    logger.debug('Received message: ', request);
  
    try {
      if (request.login) {
        startAuth().then(sendResponse);
        return true;
      } else if (request.logOut) {
        logOut();
        sendResponse({ success: true });
      } else if (request.getAccessToken) {
        logger.debug('getAccessToken: ', accessToken);
        sendResponse(accessToken);
      } else {
        throw new Error(`Did not recognize message: ${request}`);
      }
    } catch (error) {
      logger.error('Error while responding to message.', error);
      sendResponse({ error });
    }
  });
  
  // chrome.runtime.onInstalled.addListener(async () => {
  // });
}

init();




