/**
 * fileAdapter.js  –  XML-on-disk persistence
 *
 * Layout:
 *   ./storage/cbank.xml          – single CBank registry
 *   ./storage/blends/<id>.xml    – one file per CBlend document
 */

const fs   = require("fs");
const path = require("path");
const { parseCBankXML, buildCBankXML, parseCBlendXML, buildCBlendXML } =
  require("../utils/xmlTransform");

const STORAGE_DIR = path.join(__dirname);
const CBANK_FILE  = path.join(STORAGE_DIR, "cbank.xml");
const BLENDS_DIR  = path.join(STORAGE_DIR, "blends");

// ── Bootstrap ──────────────────────────────────────────────────────────────
if (!fs.existsSync(BLENDS_DIR)) fs.mkdirSync(BLENDS_DIR, { recursive: true });

if (!fs.existsSync(CBANK_FILE)) {
  const seed = buildCBankXML([
    { id:"b1", type:"title",     name:"Page Title",       version:"1.0", content:"Document Title",            items:[] },
    { id:"b2", type:"section",   name:"Section Heading",  version:"1.0", content:"Section Heading",           items:[] },
    { id:"b3", type:"paragraph", name:"Body Paragraph",   version:"1.0", content:"Paragraph content here.",   items:[] },
    { id:"b4", type:"image",     name:"Image Block",      version:"1.0", content:"image.jpg",                 items:[] },
    { id:"b5", type:"quote",     name:"Pull Quote",       version:"1.0", content:"A memorable quote.",        items:[] },
    { id:"b6", type:"list",      name:"Bullet List",      version:"1.0", content:"",                          items:["Item one","Item two","Item three"] },
    { id:"b7", type:"hero",      name:"Hero Banner",      version:"1.0", content:"Welcome\nSubtitle here",    items:[] },
    { id:"b8", type:"card",      name:"Card Grid",        version:"1.0", content:"",                          items:["Card One","Card Two","Card Three"] },
  ]);
  fs.writeFileSync(CBANK_FILE, seed, "utf8");
}

// ── CBank ──────────────────────────────────────────────────────────────────

async function getCBank() {
  const xml = fs.readFileSync(CBANK_FILE, "utf8");
  return parseCBankXML(xml);
}

async function saveCBank(blocks) {
  const xml = buildCBankXML(blocks);
  fs.writeFileSync(CBANK_FILE, xml, "utf8");
  return blocks;
}

// ── CBlend ─────────────────────────────────────────────────────────────────

async function listBlends() {
  const files = fs.readdirSync(BLENDS_DIR).filter((f) => f.endsWith(".xml"));
  return files.map((f) => {
    const xml = fs.readFileSync(path.join(BLENDS_DIR, f), "utf8");
    const doc = parseCBlendXML(xml);
    return {
      id:      doc.id,
      title:   doc.meta?.title,
      layout:  doc.meta?.layout,
      created: doc.meta?.created,
    };
  });
}

async function getBlend(id) {
  const file = path.join(BLENDS_DIR, `${id}.xml`);
  if (!fs.existsSync(file)) return null;
  const xml = fs.readFileSync(file, "utf8");
  return parseCBlendXML(xml);
}

async function saveBlend(doc) {
  const xml = buildCBlendXML(doc);
  fs.writeFileSync(path.join(BLENDS_DIR, `${doc.id}.xml`), xml, "utf8");
  return doc;
}

async function deleteBlend(id) {
  const file = path.join(BLENDS_DIR, `${id}.xml`);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

module.exports = { getCBank, saveCBank, listBlends, getBlend, saveBlend, deleteBlend };
