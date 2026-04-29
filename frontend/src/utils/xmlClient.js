/**
 * xmlClient.js
 * Lightweight client-side XML serialiser for live preview.
 * Mirrors the backend buildCBlendXML without needing a library.
 */

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCBlendXML(doc) {
  const title   = esc(doc?.meta?.title   || "Untitled");
  const layout  = esc(doc?.meta?.layout  || "custom");
  const created = esc(doc?.meta?.created || new Date().toISOString());
  const id      = esc(doc?.id            || "");
  const blocks  = doc?.blocks || [];

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<cblend id="${id}">`,
    `  <meta title="${title}" layout="${layout}" created="${created}"/>`,
  ];

  blocks.forEach((b) => {
    const isListLike = ["list", "card"].includes(b.type);
    lines.push(`  <include ref="${esc(b.ref || b.uid)}" type="${esc(b.type)}" uid="${esc(b.uid)}">`);
    if (isListLike && b.items?.length) {
      b.items.forEach((item) => lines.push(`    <item>${esc(item)}</item>`));
    } else {
      lines.push(`    <content>${esc(b.content || "")}</content>`);
    }
    lines.push(`  </include>`);
  });

  lines.push(`</cblend>`);
  return lines.join("\n");
}

export function buildCBankXML(blocks) {
  const lines = [`<?xml version="1.0" encoding="UTF-8"?>`, `<cbank>`];
  blocks.forEach((b) => {
    const isListLike = ["list", "card"].includes(b.type);
    lines.push(`  <cblock id="${esc(b.id)}" type="${esc(b.type)}" version="${esc(b.version || "1.0")}">`);
    if (isListLike && b.items?.length) {
      b.items.forEach((item) => lines.push(`    <item>${esc(item)}</item>`));
    } else {
      lines.push(`    <content>${esc(b.content || "")}</content>`);
    }
    lines.push(`  </cblock>`);
  });
  lines.push(`</cbank>`);
  return lines.join("\n");
}
