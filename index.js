const { Client } = require('@notionhq/client');
require('dotenv').config();

(async () => {
  const PARA_NAMES = ['1-Projects', '2-Areas', '3-Resources'];
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  let allNotes = [];

  const sharedEntities = (await notion.search()).results;

  const paraPages = sharedEntities.filter(({ url }) => PARA_NAMES.some((name) => url.includes(name)));
  
  await Promise.all(paraPages.map(async function handlePage(page) {
      const pageBlocks = (await notion.blocks.children.list({ block_id: page.id })).results;
      const notesDatabase = pageBlocks.find(({ type }) => type === 'child_database');

      if (!notesDatabase) return;

      const notes = (await notion.databases.query({ database_id: notesDatabase.id })).results;
      allNotes = [...allNotes, ...notes.map(({url}) => url)];

      await Promise.all(notes.map(handlePage));
    })
  );

  const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];
  console.log("🚀 ~ file: index.js ~ line 31 ~ randomNote", randomNote)
})();
