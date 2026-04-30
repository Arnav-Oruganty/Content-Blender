/**
 * storageAdapter.js
 *
 * Returns a unified storage interface for file-based XML storage.
 *
 * Exposes:
 *   CBank  – getCBank(), saveCBank(blocks)
 *   CBlend – listBlends(), getBlend(id), saveBlend(doc), deleteBlend(id)
 */

const fileAdapter = require("./fileAdapter");
const basexAdapter = require("./basexAdapter");

function getAdapter() {
  if (process.env.STORAGE_BACKEND === "basex") {
    return basexAdapter;
  }
  return fileAdapter;
}

module.exports = {
  getCBank: (...a) => getAdapter().getCBank(...a),
  saveCBank: (...a) => getAdapter().saveCBank(...a),
  listBlends: (...a) => getAdapter().listBlends(...a),
  getBlend: (...a) => getAdapter().getBlend(...a),
  saveBlend: (...a) => getAdapter().saveBlend(...a),
  deleteBlend: (...a) => getAdapter().deleteBlend(...a),
};
