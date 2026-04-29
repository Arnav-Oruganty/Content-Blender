/**
 * /api/export
 *
 * GET  /blend/:id/xml   – export blend as XML
 * GET  /blend/:id/html  – export blend as rendered HTML
 * GET  /cbank/xml       – export entire CBank as XML
 */

const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const storage = require("../storage/storageAdapter");
const { buildCBlendXML, buildCBankXML } = require("../utils/xmlTransform");

const router = express.Router();

// Convert image URL to base64 data URI
async function imageToDataURI(imgUrl) {
  if (!imgUrl) return null;
  
  try {
    // If it's a local path (starts with /uploads/)
    if (imgUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../storage", imgUrl);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const base64 = buffer.toString("base64");
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const mimeType = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        }[ext] || "image/jpeg";
        return `data:${mimeType};base64,${base64}`;
      }
    }
    
    // If it's a full URL (http/https)
    if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
      const response = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 5000 });
      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString("base64");
      const contentType = response.headers["content-type"] || "image/jpeg";
      return `data:${contentType};base64,${base64}`;
    }
  } catch (e) {
    console.warn(`Failed to fetch image ${imgUrl}:`, e.message);
  }
  
  return imgUrl; // Return original URL as fallback
}

// HTML renderer – converts a CBlend doc (JSON) to a full HTML page
async function blendToHTML(doc) {
  const title = doc.meta?.title ?? "Untitled";
  const blocks = doc.blocks ?? [];

  // Recursive function to render a block (including nested children in rows)
  async function renderBlock(b) {
    const c = (b.content ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const items = b.items ?? [];
    const width = b.width ? ` style="width: ${b.width}; ${b.height ? `min-height: ${b.height};` : ''}"` : "";

    let blockHTML = "";
    switch (b.type) {
      case "title":
        blockHTML = `<h1 class="cb-title">${c}</h1>`;
        break;
      case "section":
        blockHTML = `<h2 class="cb-section">${c}</h2>`;
        break;
      case "paragraph":
        blockHTML = `<p class="cb-para">${c}</p>`;
        break;
      case "image": {
        const imgUrl = b.url || c || "image.jpg";
        const dataUri = await imageToDataURI(imgUrl);
        const altText = b.altText || c || "Image";
        const caption = b.caption ? `<figcaption>${b.caption}</figcaption>` : "";
        blockHTML = `<figure class="cb-image"><img src="${dataUri}" alt="${altText}" />${caption}</figure>`;
        break;
      }
      case "quote":
        blockHTML = `<blockquote class="cb-quote"><p>${c}</p></blockquote>`;
        break;
      case "list":
        blockHTML = `<ul class="cb-list">${items.map((i)=>`<li>${i}</li>`).join("")}</ul>`;
        break;
      case "hero":
        const lines = c.split("\\n");
        blockHTML = `<section class="cb-hero"><h1>${lines[0]??""}</h1>${lines[1]?`<p>${lines[1]}</p>`:""}</section>`;
        break;
      case "card": {
        const cards = items.length ? items : c.split("\\n").filter(Boolean);
        blockHTML = `<div class="cb-cards">${cards.map((ci)=>`<div class="cb-card"><p>${ci}</p></div>`).join("")}</div>`;
        break;
      }
      case "row": {
        // Render row container with children in a flexbox layout
        const gap = b.gap || "16px";
        const cols = b.columns || 2;
        const childHTMLParts = [];
        for (const child of (b.children || [])) {
          const childHtml = await renderBlock(child);
          childHTMLParts.push(`
            <div class="cb-row-col" style="flex: 1 1 calc(${100 / cols}% - ${gap});">
              ${childHtml}
            </div>
          `);
        }
        blockHTML = `<div class="cb-row" style="display: flex; gap: ${gap}; flex-wrap: wrap;">
          ${childHTMLParts.join("")}
        </div>`;
        break;
      }
      default:
        blockHTML = `<div class="cb-block">${c}</div>`;
    }
    
    return width ? `<div class="cb-block-wrapper"${width}>${blockHTML}</div>` : blockHTML;
  }

  const bodyParts = [];
  for (const b of blocks) {
    const html = await renderBlock(b);
    bodyParts.push(html);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 980px; margin: 0 auto; padding: 2rem 1.5rem; }
    .cb-title { font-size: 2rem; font-weight: 600; margin-bottom: 1rem; }
    .cb-section { font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #555; margin: 2rem 0 .75rem; padding-bottom: .4rem; border-bottom: 1px solid #e0e0e0; }
    .cb-para { margin-bottom: 1rem; color: #333; }
    .cb-image { margin: 1.5rem 0; }
    .cb-image img { width: 100%; border-radius: 6px; display: block; max-height: 600px; object-fit: cover; }
    .cb-image figcaption { font-size: .8rem; color: #888; margin-top: .4rem; text-align: center; }
    .cb-quote { border-left: 3px solid #534AB7; padding: .6rem 1rem; margin: 1.2rem 0; color: #555; font-style: italic; }
    .cb-list { padding-left: 1.5rem; margin-bottom: 1rem; }
    .cb-list li { margin-bottom: .3rem; }
    .cb-hero { background: #EEEDFE; border-radius: 10px; padding: 3rem 2rem; text-align: center; margin-bottom: 2rem; }
    .cb-hero h1 { font-size: 2.2rem; color: #3C3489; }
    .cb-hero p { color: #534AB7; margin-top: .6rem; }
    .cb-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .cb-card { background: #f6f6f6; border-radius: 8px; padding: 1rem; font-size: .9rem; }
    .cb-block-wrapper { display: block; margin-bottom: 1rem; }
    .cb-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .cb-row-col { flex: 1; min-width: 200px; }
    @media (max-width: 768px) {
      .cb-row { flex-direction: column; }
      .cb-row-col { flex: 1 1 100%; }
    }
    @media print {
      .cb-row {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: flex-start !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .cb-row-col {
        flex: 1 1 0 !important;
        min-width: 0 !important;
      }
    }
  </style>
</head>
<body>
${bodyParts.join("\n")}
</body>
</html>`;
}

// GET /api/export/blend/:id/xml
router.get("/blend/:id/xml", async (req, res, next) => {
  try {
    const doc = await storage.getBlend(req.params.id);
    if (!doc) return res.status(404).json({ error: "Blend not found" });
    const xml = buildCBlendXML(doc);
    res.set("Content-Type", "application/xml");
    res.set("Content-Disposition", `attachment; filename="${req.params.id}.xml"`);
    res.send(xml);
  } catch (e) { next(e); }
});

// GET /api/export/blend/:id/html
router.get("/blend/:id/html", async (req, res, next) => {
  try {
    const doc = await storage.getBlend(req.params.id);
    if (!doc) return res.status(404).json({ error: "Blend not found" });
    const html = await blendToHTML(doc);
    res.set("Content-Type", "text/html");
    res.set("Content-Disposition", `attachment; filename="${req.params.id}.html"`);
    res.send(html);
  } catch (e) { next(e); }
});

// GET /api/export/blend/:id/pdf
router.get("/blend/:id/pdf", async (req, res, next) => {
  let browser;
  try {
    const doc = await storage.getBlend(req.params.id);
    if (!doc) return res.status(404).json({ error: "Blend not found" });
    
    const html = await blendToHTML(doc);
    
    // Launch browser with timeout
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });
    
    const page = await browser.newPage();
    // Set viewport to wide desktop width for proper CSS rendering
    await page.setViewport({ width: 1440, height: 900 });
    // Set a timeout for page operations
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Load page - use 'domcontentloaded' instead of 'networkidle0' to avoid hanging
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Give rendering a moment to complete (using Promise instead of deprecated waitForTimeout)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true
    });
    
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="${req.params.id}.pdf"`);
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.end(pdfBuffer);
    
  } catch (e) {
    console.error("PDF export error:", e);
    next(e);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
  }
});

// GET /api/export/cbank/xml
router.get("/cbank/xml", async (_req, res, next) => {
  try {
    const blocks = await storage.getCBank();
    const xml = buildCBankXML(blocks);
    res.set("Content-Type", "application/xml");
    res.set("Content-Disposition", "attachment; filename=\"cbank.xml\"");
    res.send(xml);
  } catch (e) { next(e); }
});

module.exports = router;
