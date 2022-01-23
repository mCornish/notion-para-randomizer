// const { Client } = require('@notionhq/client');
// require('dotenv').config();

const CLIENT_ID = 'b3fdb0a2-b19b-4e14-b6ec-562d15089bb7';
const REDIRECT_URI = chrome.identity.getRedirectURL();
const RESPONSE_TYPE = 'code';
const OWNER = 'user';
console.log("TEST")
const authButton = document.getElementById('authenticate');
authButton.addEventListener('click', async () => {
  // chrome.runtime.getBackgroundPage().login();
  const saveUrl = await chrome.storage.sync.get('redirectUrl');
  console.log("🚀 ~ file: index.js ~ line 13 ~ authButton.addEventListener ~ saveUrl", saveUrl)
  chrome.identity.launchWebAuthFlow({
    url: `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&owner=${OWNER}`,
    interactive: true
  }, (redirectUrl) => {
    chrome.storage.sync.set({ redirectUrl });
  console.log("🚀 ~ file: index.js ~ line 16 ~ authButton.addEventListener ~ redirectUrl", redirectUrl)
  });
});

// (async () => {
//   const notion = new Client({ auth: process.env.NOTION_TOKEN });

//   // We must include undefined as an option to account for the first page, for which we are provided no cursor
//   // let cursors = [undefined]
//   const PAGE_SIZE = 100;

//   async function getNextCursors(start_cursor) {
//     const searchResponse = await notion.search({
//       object: 'page',
//       page_size: PAGE_SIZE,
//       start_cursor
//     });
    
//     if (searchResponse.has_more) {
//       // cursors.push(searchResponse.next_cursor);
//       return [start_cursor, ...(await getNextCursors(searchResponse.next_cursor))];
//     }

//     return [start_cursor];
//   }

//   chrome.storage.sync.get('cursors', ({ cursors: storedCursors }) => {
//     const cursors = storedCursors ? storedCursors.split(',') : getNextCursors();
//     console.log("🚀 ~ file: index.js ~ line 28 ~ chrome.storage.sync.get ~ cursors", cursors)

//     chrome.storage.sync.set({ cursors: cursors.join(',') });

//     const randomCursor = cursors[Math.floor(Math.random() * (cursors.length - 1))];

//     const results = (await notion.search({
//       object: 'page',
//       page_size: PAGE_SIZE,
//       start_cursor: randomCursor
//     })).results;

//     const randomResult = results[Math.floor(Math.random() * (results.length - 1))];
//     let noteUrlElement = document.getElementById("noteUrlElement");
//     noteUrlElement.innerHTML = randomResult.url;
//     console.log("RANDOM NOTE URL:", randomResult.url)
//   });
//   await getNextCursor();
// })();
