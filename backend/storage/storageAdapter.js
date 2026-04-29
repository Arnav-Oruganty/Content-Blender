/**
 * storageAdapter.js
 *
 * Returns a unified storage interface regardless of whether the
 * STORAGE_BACKEND env var is "file" or "mongo".
 *
 * Both adapters expose:
 *   CBank  – getCBank(), saveCBank(blocks)
 *   CBlend – listBlends(), getBlend(id), saveBlend(doc), deleteBlend(id)
 */

const BACKEND = process.env.STORAGE_BACKEND || "file";

let adapter;

function getAdapter() {
  if (adapter) return adapter;
  if (BACKEND === "mongo") {
    adapter = require("./mongoAdapter");
  } else {
    adapter = require("./fileAdapter");
  }
  return adapter;
}

module.exports = {
  getCBank: (...a) => getAdapter().getCBank(...a),
  saveCBank: (...a) => getAdapter().saveCBank(...a),
  listBlends: (...a) => getAdapter().listBlends(...a),
  getBlend: (...a) => getAdapter().getBlend(...a),
  saveBlend: (...a) => getAdapter().saveBlend(...a),
  deleteBlend: (...a) => getAdapter().deleteBlend(...a),
};
