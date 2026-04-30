/**
 * basexAdapter.js  –  XML persistence using BaseX database
 *
 * Layout inside 'content_blender' DB:
 *   cbank/cbank.xml          – single CBank registry
 *   blends/<id>.xml          – one document per CBlend
 */

const basexClient = require("../utils/basex");
const { parseCBankXML, buildCBankXML, parseCBlendXML, buildCBlendXML } = require("../utils/xmlTransform");

const DB_NAME = "content_blender";

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function ensureInit() {
  await basexClient.ensureDatabase(DB_NAME);
  
  // Check if cbank exists
  try {
    const exists = await basexClient.query(`db:exists('${DB_NAME}', 'cbank/cbank.xml')`);
    if (exists.trim() === "false") {
      const seed = buildCBankXML([
        { id:"b1", type:"title",     name:"Page Title",       version:"1.0", content:"Document Title",            items:[] },
        { id:"b2", type:"section",   name:"Section Heading",  version:"1.0", content:"Section Heading",           items:[] },
        { id:"b3", type:"paragraph", name:"Body Paragraph",   version:"1.0", content:"Paragraph content here.",   items:[] },
        { id:"b4", type:"image",     name:"Image Block",      version:"1.0", content:"", url:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80", items:[] },
        { id:"b5", type:"quote",     name:"Pull Quote",       version:"1.0", content:"A memorable quote.",        items:[] },
        { id:"b6", type:"list",      name:"Bullet List",      version:"1.0", content:"",                          items:["Item one","Item two","Item three"] },
        { id:"b7", type:"hero",      name:"Hero Banner",      version:"1.0", content:"Welcome\nSubtitle here",    items:[] },
        { id:"b8", type:"card",      name:"Card Grid",        version:"1.0", content:"",                          items:["Card One","Card Two","Card Three"] },
      ]);
      await basexClient.replace("cbank/cbank.xml", seed);
      console.log("   📦  BaseX: CBank seeded with 8 default blocks");
    }
  } catch (err) {
    console.error("BaseX Init Error:", err);
  }
}

// Ensure init runs on load
ensureInit().catch(console.error);

// ── CBank ──────────────────────────────────────────────────────────────────

async function getCBank() {
  try {
    const xml = await basexClient.query(`db:get('${DB_NAME}', 'cbank/cbank.xml')`);
    return parseCBankXML(xml);
  } catch (err) {
    if (err.message && err.message.includes("not found")) return [];
    throw err;
  }
}

async function saveCBank(blocks) {
  const xml = buildCBankXML(blocks);
  await basexClient.replace("cbank/cbank.xml", xml);
  return blocks;
}

// ── CBlend ─────────────────────────────────────────────────────────────────

async function listBlends() {
  try {
    // We can use XQuery to fetch just the metadata of all blends efficiently
    const xquery = `
      for $d in db:get('${DB_NAME}', 'blends')
      let $blend := $d/cblend
      let $id := string($blend/@id)
      let $title := string($blend/meta/@title)
      let $layout := string($blend/meta/@layout)
      let $created := string($blend/meta/@created)
      return concat($id, '||', $title, '||', $layout, '||', $created)
    `;
    const results = await basexClient.query(xquery);
    if (!results) return [];
    
    // BaseX node driver returns results separated by newline if multiple
    const lines = results.split('\\n').filter(l => l.trim().length > 0);
    return lines.map(line => {
      const [id, title, layout, created] = line.split('||');
      return { id, title, layout, created };
    });
  } catch (err) {
    if (err.message && err.message.includes("not found")) return [];
    throw err;
  }
}

async function getBlend(id) {
  try {
    const xml = await basexClient.query(`db:get('${DB_NAME}', 'blends/${id}.xml')`);
    if (!xml) return null;
    return parseCBlendXML(xml);
  } catch (err) {
    if (err.message && err.message.includes("not found")) return null;
    throw err;
  }
}

async function saveBlend(doc) {
  const xml = buildCBlendXML(doc);
  await basexClient.replace(`blends/${doc.id}.xml`, xml);
  return doc;
}

async function deleteBlend(id) {
  try {
    await basexClient.execute(`OPEN ${DB_NAME}`);
    await basexClient.execute(`DELETE blends/${id}.xml`);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { getCBank, saveCBank, listBlends, getBlend, saveBlend, deleteBlend };
