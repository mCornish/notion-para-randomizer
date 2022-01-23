const { Client } = require('@notionhq/client');
require('dotenv').config();

(async () => {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // We must include undefined as an option to account for the first page, for which we are provided no cursor
  let cursors = [undefined]
  const PAGE_SIZE = 100;

  async function search(start_cursor) {
    const searchResponse = await notion.search({
      object: 'page',
      page_size: PAGE_SIZE,
      start_cursor
    });
    
    if (searchResponse.has_more) {
      cursors.push(searchResponse.next_cursor);
      await search(searchResponse.next_cursor);
    }
  }

  await search();

  const randomCursor = cursors[Math.floor(Math.random() * (cursors.length - 1))];

  const results = (await notion.search({
    object: 'page',
    page_size: PAGE_SIZE,
    start_cursor: randomCursor
  })).results;

  const randomResult = results[Math.floor(Math.random() * (results.length - 1))];
  console.log("RANDOM NOTE URL:", randomResult.url)
})();
