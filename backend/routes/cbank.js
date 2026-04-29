/**
 * /api/cbank
 *
 * GET    /       – list all blocks (JSON)
 * GET    /xml    – full CBank as XML
 * GET    /:id    – single block
 * POST   /       – create block
 * PUT    /:id    – update block
 * DELETE /:id    – delete block
 */

const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const storage = require("../storage/storageAdapter");
const { buildCBankXML } = require("../utils/xmlTransform");

const router = express.Router();

const VALID_TYPES = ["title","section","paragraph","image","quote","list","hero","card","row"];

const blockRules = [
  body("type").isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(", ")}`),
  body("name").optional().isString(),
  body("content").optional().isString(),
  body("items").optional().isArray(),
  body("version").optional().isString(),
  // Image metadata
  body("sourceType").optional().isString(),
  body("url").optional().isString(),
  body("altText").optional().isString(),
  body("caption").optional().isString(),
  // Container type
  body("containerType").optional().isString(),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET /api/cbank
router.get("/", async (_req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    res.json({ ok: true, data: blocks, count: blocks.length });
  } catch (e) { next(e); }
});

// GET /api/cbank/xml
router.get("/xml", async (_req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    const xml = buildCBankXML(blocks);
    res.set("Content-Type", "application/xml").send(xml);
  } catch (e) { next(e); }
});

// GET /api/cbank/:id
router.get("/:id", param("id").notEmpty(), validate, async (req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    const block  = blocks.find((b) => b.id === req.params.id);
    if (!block) return res.status(404).json({ error: "Block not found" });
    res.json({ ok: true, data: block });
  } catch (e) { next(e); }
});

// POST /api/cbank
router.post("/", blockRules, validate, async (req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    const id = req.body.id || `b${uuidv4().slice(0, 6)}`;
    if (blocks.find((b) => b.id === id))
      return res.status(409).json({ error: `Block with id '${id}' already exists` });

    const newBlock = {
      id,
      type:    req.body.type,
      name:    req.body.name    ?? "",
      version: req.body.version ?? "1.0",
      content: req.body.content ?? "",
      items:   req.body.items   ?? [],
      // Image metadata
      sourceType: req.body.sourceType ?? "url",
      url:        req.body.url        ?? "",
      altText:    req.body.altText    ?? "",
      caption:    req.body.caption    ?? "",
      // Container type
      containerType: req.body.containerType ?? null,
    };
    blocks.push(newBlock);
    await storage.saveCBank(blocks);
    res.status(201).json({ ok: true, data: newBlock });
  } catch (e) { next(e); }
});

// PUT /api/cbank/:id
router.put("/:id", blockRules, validate, async (req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    const idx    = blocks.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Block not found" });

    blocks[idx] = {
      ...blocks[idx],
      type:    req.body.type    ?? blocks[idx].type,
      name:    req.body.name    ?? blocks[idx].name,
      version: req.body.version ?? blocks[idx].version,
      content: req.body.content ?? blocks[idx].content,
      items:   req.body.items   ?? blocks[idx].items,
      // Image metadata
      sourceType: req.body.sourceType ?? blocks[idx].sourceType ?? "url",
      url:        req.body.url        ?? blocks[idx].url        ?? "",
      altText:    req.body.altText    ?? blocks[idx].altText    ?? "",
      caption:    req.body.caption    ?? blocks[idx].caption    ?? "",
      // Container type
      containerType: req.body.containerType !== undefined ? req.body.containerType : blocks[idx].containerType,
    };
    await storage.saveCBank(blocks);
    res.json({ ok: true, data: blocks[idx] });
  } catch (e) { next(e); }
});

// DELETE /api/cbank/:id
router.delete("/:id", param("id").notEmpty(), validate, async (req, res, next) => {
  try {
    let blocks = await storage.getCBank();
    const before = blocks.length;
    blocks = blocks.filter((b) => b.id !== req.params.id);
    if (blocks.length === before) return res.status(404).json({ error: "Block not found" });
    await storage.saveCBank(blocks);
    res.json({ ok: true, message: `Block '${req.params.id}' deleted` });
  } catch (e) { next(e); }
});

module.exports = router;
