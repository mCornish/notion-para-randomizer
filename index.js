const logger = console;

const authButton = document.getElementById('authenticate');
const authenticatedElement = document.getElementById('authenticated');
const noteButton = document.getElementById('get-random-note');
const logOutButton = document.getElementById('log-out');
const loaderElement = document.getElementById('loader');

function updateUi(accessToken) {
  logger.debug('Updating UI with access token: ', accessToken);

  const hasAccessToken = !!accessToken && (typeof accessToken === 'string') && accessToken.includes('secret');

  if (hasAccessToken) {
    authButton.hidden = true;
    authenticatedElement.hidden = false;
  } else {
    authButton.hidden = false;
    authenticatedElement.hidden = true;
  }
}

async function init() {
  logger.debug('Initializing extension');
  let accessToken = null;
  chrome.runtime.sendMessage({ getAccessToken: true }, (response) => {
    updateUi(response);
    accessToken = response;
  });

  authButton.addEventListener('click', async () => {
    logger.debug('Clicked auth button');
    const response = chrome.runtime.sendMessage({ login: true }, updateUi);
    if (response?.error) throw new Error('Failed to complete login.', response.error);

    accessToken = response;
  });
  
  noteButton.addEventListener('click', async () => {
    logger.debug('Clicked note button');
    if (!accessToken) throw new Error('Attempted to get random note without access token.');

    loaderElement.hidden = false;
    authenticatedElement.hidden = true;
    const randomNote = await getRandomNote(accessToken);
    window.open(randomNote.url, '_blank');
    loaderElement.hidden = true;
  });

  logOutButton.addEventListener('click', async () => {
    logger.debug('Clicked log out button');
    if (!accessToken) logger.warn('Attempting to log out without access token.');

    const response = chrome.runtime.sendMessage({ logOut: true }, updateUi);
    if (response?.error) throw new Error('Failed to log out.', response.error);
  });
}

init();

function NotionClient({ auth: token }) {
  const search = async (options) => {
    try {
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2021-08-16',
        },
        body: JSON.stringify(options),
      });

      const json = await response.json();
      logger.debug('Search response: ', json);

      if (json.object === 'error') throw new Error(json.message);
      return json;
    } catch(err) {
      throw new Error(`Failed to fetch search results: ${err.message}`);
    }
  };

  return {
    search
  };
}

async function getRandomNote(accessToken) {
  const notion = NotionClient({ auth: accessToken });

  // We must include undefined as an option to account for the first page, for which we are provided no cursor
  // let cursors = [undefined]
  const PAGE_SIZE = 100;

  async function getNextCursor(start_cursor) {
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      page_size: PAGE_SIZE,
      start_cursor
    });
    
    if (searchResponse.has_more) {
      if (!searchResponse.next_cursor) throw new Error('No next cursor found.');
      return [start_cursor, ...(await getNextCursor(searchResponse.next_cursor))];
    }

    return [start_cursor];
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get('cursors', async ({ cursors: storedCursors }) => {
        let cursors = [];

        try {
          // TODO: Use storage to optimize use of cursors
          // cursors = storedCursors ? [undefined, ...storedCursors.split(',')] : await getNextCursor();
          cursors = await getNextCursor();
        } catch(err) {
          logger.error('Failed to get cursors: ', err);
          await chrome.storage.sync.set({ cursors: null });
        }

        console.log("🚀 ~ file: index.js ~ line 28 ~ chrome.storage.sync.get ~ cursors", cursors)

        chrome.storage.sync.set({ cursors: cursors.slice(1).join(',') });

        const randomCursor = cursors[Math.floor(Math.random() * (cursors.length - 1))];
        logger.debug("Got random cursor: ", randomCursor);

        const results = (await notion.search({
          filter: {
            property: 'object',
            value: 'page',
          },
          page_size: PAGE_SIZE,
          start_cursor: randomCursor
        })).results;

        const randomResult = results[Math.floor(Math.random() * (results.length - 1))];
        console.debug("Generated random note:", randomResult);

        resolve(randomResult);
      });
    } catch(err) {
      reject(err);
    }
  });
}
