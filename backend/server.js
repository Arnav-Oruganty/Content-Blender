require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");

const cbankRouter = require("./routes/cbank");
const cblendRouter = require("./routes/cblend");
const exportRouter = require("./routes/export");
const healthRouter = require("./routes/health");
const uploadRouter = require("./routes/upload");

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Increase timeout for PDF generation (120 seconds)
app.use((req, res, next) => {
  if (req.path.includes('/export') && req.path.includes('/pdf')) {
    res.setTimeout(120000); // 2 minutes for PDF generation
  } else {
    res.setTimeout(30000); // 30 seconds for other requests
  }
  next();
});

// ── Static files for uploads ───────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "storage/uploads")));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/health", healthRouter);
app.use("/api/cbank", cbankRouter);
app.use("/api/cblend", cblendRouter);
app.use("/api/export", exportRouter);
app.use("/api/upload", uploadRouter);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Error handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function boot() {
  app.listen(PORT, () => {
    console.log(`\n✅  Content Blender API running on http://localhost:${PORT}`);
    console.log(`   Storage backend : file (XML-based)`);
    console.log(`   Environment     : ${process.env.NODE_ENV || "development"}\n`);
  });
}

boot().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
