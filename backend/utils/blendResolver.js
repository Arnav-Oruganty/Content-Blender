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
    return b;
  }

  doc.blocks = (doc.blocks || []).map(prepareBlock);
  return doc;
}

module.exports = {
  resolveShallowCopy,
  prepareShallowCopy
};
