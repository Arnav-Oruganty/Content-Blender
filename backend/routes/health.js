const express = require("express");
const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "Content Blender API",
    version: "1.0.0",
    storage: process.env.STORAGE_BACKEND || "file",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
