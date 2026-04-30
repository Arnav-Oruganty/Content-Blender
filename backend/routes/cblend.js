const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const storage = require("../storage/storageAdapter");
const { buildCBlendXML } = require("../utils/xmlTransform");

const router = express.Router();

// Helper to normalize block from request body (recursively for children)
function normalizeBlock(b) {
  return {
    uid:     b.uid || uuidv4().slice(0, 8),
    ref:     b.ref || b.uid || uuidv4().slice(0, 8),
    type:    b.type,
    content: b.content !== undefined ? b.content : undefined,
    items:   b.items !== undefined ? b.items : undefined,
    // Image metadata
    sourceType: b.sourceType ?? "url",
    url:        b.url        ?? "",
    altText:    b.altText    ?? "",
    caption:    b.caption    ?? "",
    // Size properties
    width:      b.width      ?? "100%",
    height:     b.height     ?? "auto",
    // Container type
    containerType: b.containerType ?? null,
    // Row-specific properties
    columns:    b.columns    ?? (b.type === "row" ? 2 : undefined),
    gap:        b.gap        ?? (b.type === "row" ? "16px" : undefined),
    layout:     b.layout     ?? (b.type === "row" ? "horizontal" : undefined),
    // Row children (recursive)
    children: (b.children ?? []).map((child) => normalizeBlock(child)),
  };
}

const blendRules = [
  body("meta.title").optional().isString(),
  body("meta.layout").optional().isString(),
  body("blocks").optional().isArray(),
  body("blocks.*.type").optional().isString(),
  body("blocks.*.content").optional().isString(),
  body("blocks.*.items").optional().isArray(),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET /api/cblend
router.get("/", async (_req, res, next) => {
  try {
    const list = await storage.listBlends();
    res.json({ ok: true, data: list, count: list.length });
  } catch (e) { next(e); }
});

const { resolveShallowCopy, prepareShallowCopy } = require("../utils/blendResolver");

// GET /api/cblend/:id
router.get("/:id", param("id").notEmpty(), validate, async (req, res, next) => {
  try {
    const doc = await storage.getBlend(req.params.id);
    if (!doc) return res.status(404).json({ error: "Blend not found" });
    const resolvedDoc = await resolveShallowCopy(doc);
    res.json({ ok: true, data: resolvedDoc });
  } catch (e) { next(e); }
});

// GET /api/cblend/:id/xml
router.get("/:id/xml", param("id").notEmpty(), validate, async (req, res, next) => {
  try {
    const doc = await storage.getBlend(req.params.id);
    if (!doc) return res.status(404).json({ error: "Blend not found" });
    const resolvedDoc = await resolveShallowCopy(doc);
    const xml = buildCBlendXML(resolvedDoc);
    res.set("Content-Type", "application/xml").send(xml);
  } catch (e) { next(e); }
});

// POST /api/cblend
router.post("/", blendRules, validate, async (req, res, next) => {
  try {
    const id = req.body.id || `blend-${uuidv4().slice(0, 8)}`;
    const doc = {
      id,
      meta: {
        title:   req.body.meta?.title   ?? "Untitled",
        layout:  req.body.meta?.layout  ?? "custom",
        created: req.body.meta?.created ?? new Date().toISOString(),
        copyMode: req.body.meta?.copyMode ?? "shallow",
      },
      blocks: (req.body.blocks ?? []).map((b) => normalizeBlock(b)),
    };
    const preparedDoc = await prepareShallowCopy(doc);
    await storage.saveBlend(preparedDoc);
    
    // Return resolved doc to frontend so it has full content populated
    const resolvedDoc = await resolveShallowCopy(preparedDoc);
    res.status(201).json({ ok: true, data: resolvedDoc });
  } catch (e) { next(e); }
});

// PUT /api/cblend/:id
router.put("/:id", blendRules, validate, async (req, res, next) => {
  try {
    const existing = await storage.getBlend(req.params.id);
    if (!existing) return res.status(404).json({ error: "Blend not found" });

    const doc = {
      id: req.params.id,
      meta: {
        title:   req.body.meta?.title   ?? existing.meta?.title,
        layout:  req.body.meta?.layout  ?? existing.meta?.layout,
        created: existing.meta?.created ?? new Date().toISOString(),
        copyMode: req.body.meta?.copyMode ?? existing.meta?.copyMode ?? "shallow",
      },
      blocks: req.body.blocks !== undefined
        ? req.body.blocks.map((b) => normalizeBlock(b))
        : existing.blocks,
    };
    const preparedDoc = await prepareShallowCopy(doc);
    await storage.saveBlend(preparedDoc);
    
    // Return resolved doc to frontend so it has full content populated
    const resolvedDoc = await resolveShallowCopy(preparedDoc);
    res.json({ ok: true, data: resolvedDoc });
  } catch (e) { next(e); }
});

// DELETE /api/cblend/:id
router.delete("/:id", param("id").notEmpty(), validate, async (req, res, next) => {
  try {
    const deleted = await storage.deleteBlend(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Blend not found" });
    res.json({ ok: true, message: `Blend '${req.params.id}' deleted` });
  } catch (e) { next(e); }
});

module.exports = router;
