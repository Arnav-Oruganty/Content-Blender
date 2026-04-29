/**
 * mongoAdapter.js  –  MongoDB persistence via Mongoose
 *
 * Collections:
 *   cblocks  – CBank entries (one document per block)
 *   cblends  – CBlend documents (one document per blend)
 *
 * The XML is stored as a field so it remains the single source of truth.
 * JSON fields are derived and stored for query performance.
 */

const mongoose = require("mongoose");
const { buildCBankXML, buildCBlendXML } = require("../utils/xmlTransform");

// ── Schemas ────────────────────────────────────────────────────────────────

const CBlockSchema = new mongoose.Schema(
  {
    id:      { type: String, required: true, unique: true, index: true },
    type:    { type: String, required: true, enum: ["title","section","paragraph","image","quote","list","hero","card"] },
    version: { type: String, default: "1.0" },
    content: { type: String, default: "" },
    items:   [{ type: String }],
    xml:     { type: String },   // canonical XML fragment
  },
  { timestamps: true }
);

// Regenerate xml fragment before saving
CBlockSchema.pre("save", function () {
  this.xml = buildCBankXML([this.toObject()]);
});

const CBlendSchema = new mongoose.Schema(
  {
    id:     { type: String, required: true, unique: true, index: true },
    meta:   {
      title:   { type: String, default: "Untitled" },
      layout:  { type: String, default: "custom" },
      created: { type: String },
    },
    blocks: [
      {
        uid:     String,
        ref:     String,
        type:    String,
        content: { type: String, default: "" },
        items:   [String],
      },
    ],
    xml: { type: String }, // canonical XML document
  },
  { timestamps: true }
);

CBlendSchema.pre("save", function () {
  this.xml = buildCBlendXML(this.toObject());
});

const CBlock = mongoose.models.CBlock || mongoose.model("CBlock", CBlockSchema);
const CBlend = mongoose.models.CBlend || mongoose.model("CBlend", CBlendSchema);

// ── CBank ──────────────────────────────────────────────────────────────────

async function getCBank() {
  return CBlock.find({}).lean();
}

async function saveCBank(blocks) {
  // Replace entire bank using bulkWrite for atomicity
  const ops = blocks.map((b) => ({
    updateOne: {
      filter: { id: b.id },
      update: { $set: b },
      upsert: true,
    },
  }));
  if (ops.length) await CBlock.bulkWrite(ops);
  return getCBank();
}

// ── CBlend ─────────────────────────────────────────────────────────────────

async function listBlends() {
  return CBlend.find({}, { id: 1, meta: 1, _id: 0 }).lean();
}

async function getBlend(id) {
  return CBlend.findOne({ id }).lean();
}

async function saveBlend(doc) {
  return CBlend.findOneAndUpdate(
    { id: doc.id },
    { $set: doc },
    { upsert: true, new: true, lean: true }
  );
}

async function deleteBlend(id) {
  const res = await CBlend.deleteOne({ id });
  return res.deletedCount > 0;
}

module.exports = { getCBank, saveCBank, listBlends, getBlend, saveBlend, deleteBlend, CBlock, CBlend };
