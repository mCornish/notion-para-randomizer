const { Client } = require("@notionhq/client");
require("dotenv").config();

(async () => {
  // The names of my top-level PARA pages
  const PARA_NAMES = ["1 Projects", "2 Areas", "3 Resources"];
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  let allNotes = [];

  /**
   * Recursively get all notes for a page containing a database of notes
   * @param {string} page - A Notion Page object that either contains a single database of notes or is itself a note.
  **/
  async function notesFromPage(page) {
    const pageBlocks = (
      await notion.blocks.children.list({ block_id: page.id })
    ).results;
    const notesDatabase = pageBlocks.find(
      ({ type }) => type === "child_database"
    );
  
    if (!notesDatabase) return [];
  
    const notes = (
      await notion.databases.query({ database_id: notesDatabase.id })
    ).results;

    const childNotes = await Promise.all(notes.flatMap(notesFromPage));
    console.log("🚀 ~ file: index.js ~ line 30 ~ notesFromPage ~ childNotes", childNotes)

    return Promise.all([
      ...notes.map(({ url }) => url),
      ...notes.map(notesFromPage).flat()
    ]);
  }

  await Promise.all(PARA_NAMES.map(async (pageName) => {
    const sharedEntities = (
      await notion.search({
        query: pageName,
        filter: { property: 'object', value: "page" },
      })
    ).results;
  
    const nameSlug = pageName.replace(/\s/g, "-").toLowerCase();
    const page = sharedEntities.find(({ url }) =>
      url.toLowerCase().includes(nameSlug)
    );
  
    if (!page) throw new Error(`Could not find page ${pageName}`);

    const notes = await notesFromPage(page);
    // console.log("🚀 ~ file: index.js ~ line 53 ~ awaitPromise.all ~ notes", notes)

    allNotes = [...allNotes, ...notes];
  }));

  // console.log("🚀 ~ file: index.js ~ line 54 ~ awaitPromise.all ~ allNotes", allNotes)


  const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];
  console.log("🚀 ~ file: index.js ~ line 31 ~ randomNote", randomNote);
})();
