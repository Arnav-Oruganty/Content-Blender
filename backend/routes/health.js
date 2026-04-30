const express = require("express");
const router = express.Router();

router.get("/", async (_req, res) => {
  const storage = process.env.STORAGE_BACKEND || "file";
  let dbOk = true;

  if (storage === "basex") {
    const basexClient = require("../utils/basex");
    dbOk = await basexClient.ping();
  }

  res.json({
    ok: dbOk,
    service: "Content Blender API",
    version: "1.0.0",
    storage,
    database_connected: dbOk,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
