const storage = require("../storage/storageAdapter");

async function resolveShallowCopy(doc) {
  if (doc.meta?.copyMode === "deep") return doc;

  const cbankBlocks = await storage.getCBank();
  const cbankMap = new Map(cbankBlocks.map(b => [b.id, b]));

  function resolveBlock(b) {
    if (b.type === "row" && b.children) {
      b.children = b.children.map(resolveBlock);
    }
    const cbankBlock = cbankMap.get(b.ref || b.uid);
    if (!cbankBlock) return b;

    if (b.content === undefined && cbankBlock.content !== undefined) {
      b.content = cbankBlock.content;
    }
    if (b.items === undefined && cbankBlock.items !== undefined && cbankBlock.items.length > 0) {
      b.items = [...cbankBlock.items];
    }
    if (b.type === "image") {
      if (b.url === undefined && cbankBlock.url !== undefined) b.url = cbankBlock.url;
      if (b.altText === undefined && cbankBlock.altText !== undefined) b.altText = cbankBlock.altText;
      if (b.caption === undefined && cbankBlock.caption !== undefined) b.caption = cbankBlock.caption;
      if (b.sourceType === undefined && cbankBlock.sourceType !== undefined) b.sourceType = cbankBlock.sourceType;
    }
    return b;
  }

  doc.blocks = (doc.blocks || []).map(resolveBlock);
  return doc;
}

async function prepareShallowCopy(doc) {
  if (doc.meta?.copyMode === "deep") return doc;

  const cbankBlocks = await storage.getCBank();
  const cbankMap = new Map(cbankBlocks.map(b => [b.id, b]));

  function prepareBlock(b) {
    if (b.type === "row" && b.children) {
      b.children = b.children.map(prepareBlock);
    }
    const cbankBlock = cbankMap.get(b.ref || b.uid);
    if (!cbankBlock) return b;

    if (b.content !== undefined && b.content === cbankBlock.content) {
      b.content = undefined;
    }
    if (b.items !== undefined && JSON.stringify(b.items) === JSON.stringify(cbankBlock.items || [])) {
      b.items = undefined;
    }
    if (b.type === "image") {
      if (b.url !== undefined && b.url === cbankBlock.url) b.url = undefined;
      if (b.altText !== undefined && b.altText === cbankBlock.altText) b.altText = undefined;
      if (b.caption !== undefined && b.caption === cbankBlock.caption) b.caption = undefined;
      if (b.sourceType !== undefined && b.sourceType === cbankBlock.sourceType) b.sourceType = undefined;
    }
    return b;
  }

  doc.blocks = (doc.blocks || []).map(prepareBlock);
  return doc;
}

module.exports = {
  resolveShallowCopy,
  prepareShallowCopy
};
