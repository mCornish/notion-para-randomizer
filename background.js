function login() {
  chrome.identity.launchWebAuthFlow({
    url: `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&owner=${OWNER}`,
    interactive: true
  });
}
chrome.runtime.onInstalled.addListener(async () => {
  // const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // const PAGE_SIZE = 100;

  // async function getNextCursors(start_cursor) {
  //   const searchResponse = await notion.search({
  //     object: 'page',
  //     page_size: PAGE_SIZE,
  //     start_cursor
  //   });
    
  //   if (searchResponse.has_more) {
  //     // cursors.push(searchResponse.next_cursor);
  //     return [start_cursor, ...(await getNextCursors(searchResponse.next_cursor))];
  //   }

  //   return [start_cursor];
  // }

  // const cursors = await getNextCursors();
  // console.log("🚀 ~ file: index.js ~ line 28 ~ chrome.storage.sync.get ~ cursors", cursors)

  // chrome.storage.sync.set({ cursors: cursors.join(',') });
});


