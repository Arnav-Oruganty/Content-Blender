const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const PARSE_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["cblock", "include", "item"].includes(name),
  parseTagValue: false,
  trimValues: true,
};

const BUILD_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: false,
};

const parser  = new XMLParser(PARSE_OPTS);
const builder = new XMLBuilder(BUILD_OPTS);

// ── CBank ──────────────────────────────────────────────────────────────────

function parseCBankXML(xml) {
  const obj = parser.parse(xml);
  const raw = obj?.cbank?.cblock ?? [];
  return raw.map(normaliseBlock);
}

function normaliseBlock(b) {
  const metadata = b.metadata ?? {};
  return {
    id:      b["@_id"],
    type:    b["@_type"],
    name:    b["@_name"]    ?? "",
    version: b["@_version"] ?? "1.0",
    content: b.content ?? "",
    items:   Array.isArray(b.item) ? b.item : b.item ? [b.item] : [],
    // Image metadata
    sourceType: metadata["@_sourceType"] ?? "url",
    url:        metadata["@_url"]        ?? "",
    altText:    metadata["@_altText"]    ?? "",
    caption:    metadata["@_caption"]    ?? "",
    containerType: b["@_containerType"] ?? null,
  };
}

function buildCBankXML(blocks) {
  const obj = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    cbank: {
      cblock: blocks.map((b) => {
        const base = {
          "@_id":      b.id,
          "@_type":    b.type,
          "@_name":    b.name    ?? "",
          "@_version": b.version ?? "1.0",
          content:     b.content ?? "",
        };

        // Add containerType if present
        if (b.containerType) {
          base["@_containerType"] = b.containerType;
        }

        // Add metadata for images
        if (b.type === "image" && (b.url || b.altText)) {
          base.metadata = {
            "@_sourceType": b.sourceType ?? "url",
            "@_url":        b.url ?? "",
            "@_altText":    b.altText ?? "",
            "@_caption":    b.caption ?? "",
          };
        }

        // Add items if present
        if (b.items?.length) {
          base.item = b.items;
        }

        return base;
      }),
    },
  };
  return builder.build(obj);
}

// ── CBlend ─────────────────────────────────────────────────────────────────

function parseCBlendXML(xml) {
  const obj     = parser.parse(xml);
  const root    = obj?.cblend ?? {};
  const meta    = root.meta   ?? {};
  const includes = root.include ?? [];
  return {
    id:   root["@_id"] ?? null,
    meta: {
      title:   meta["@_title"]   ?? "Untitled",
      layout:  meta["@_layout"]  ?? "custom",
      created: meta["@_created"] ?? new Date().toISOString(),
      copyMode: meta["@_copyMode"] ?? "shallow",
    },
    blocks: includes.map((inc) => normaliseInclude(inc, includes)),
  };
}

function normaliseInclude(inc, allIncludes = []) {
  const metadata = inc.metadata ?? {};
  const result = {
    uid:     inc["@_uid"] ?? inc["@_ref"],
    ref:     inc["@_ref"] ?? inc["@_uid"],
    type:    inc["@_type"],
    content: inc.content !== undefined ? inc.content : undefined,
    items:   inc.item !== undefined ? (Array.isArray(inc.item) ? inc.item : [inc.item]) : undefined,
    // Size properties
    width:      inc["@_width"]  ?? "100%",
    height:     inc["@_height"] ?? "auto",
    // Image metadata
    sourceType: metadata["@_sourceType"] ?? "url",
    url:        metadata["@_url"]        ?? "",
    altText:    metadata["@_altText"]    ?? "",
    caption:    metadata["@_caption"]    ?? "",
    containerType: inc["@_containerType"] ?? null,
    // Row-specific properties
    columns:    inc["@_columns"] ? parseInt(inc["@_columns"]) : undefined,
    gap:        inc["@_gap"] ?? undefined,
    layout:     inc["@_layout"] ?? undefined,
    // Row children
    children: Array.isArray(inc.include) ? inc.include.map((child) => normaliseInclude(child, allIncludes)) : [],
  };
  return result;
}

function buildCBlendXML(doc) {
  const isDeepCopy = doc.meta?.copyMode === "deep";
  const obj = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    cblend: {
      "@_id": doc.id,
      meta: {
        "@_title":   doc.meta?.title   ?? "Untitled",
        "@_layout":  doc.meta?.layout  ?? "custom",
        "@_created": doc.meta?.created ?? new Date().toISOString(),
      },
      include: (doc.blocks ?? []).map((b) => buildIncludeElement(b, isDeepCopy)),
    },
  };
  
  if (doc.meta?.copyMode) {
    obj.cblend.meta["@_copyMode"] = doc.meta.copyMode;
  }
  
  return builder.build(obj);
}

function buildIncludeElement(b, isDeepCopy = false) {
  const base = {
    "@_type": b.type,
    "@_uid":  b.uid,
  };
  
  if (!isDeepCopy) {
    base["@_ref"] = b.ref ?? b.uid;
  }

  // Add size properties
  if (b.width && b.width !== "100%") {
    base["@_width"] = b.width;
  }
  if (b.height && b.height !== "auto") {
    base["@_height"] = b.height;
  }

  // Add containerType if present
  if (b.containerType) {
    base["@_containerType"] = b.containerType;
  }

  // Add row-specific properties
  if (b.type === "row") {
    if (b.columns !== undefined && b.columns !== null) {
      base["@_columns"] = b.columns.toString();
    }
    if (b.gap) {
      base["@_gap"] = b.gap;
    }
    if (b.layout) {
      base["@_layout"] = b.layout;
    }
  }

  // Add metadata for images
  if (b.type === "image" && (b.url || b.altText)) {
    base.metadata = {
      "@_sourceType": b.sourceType ?? "url",
      "@_url":        b.url ?? "",
      "@_altText":    b.altText ?? "",
      "@_caption":    b.caption ?? "",
    };
  }

  // Add content or items
  if (b.items !== undefined && b.items !== null && b.items.length > 0) {
    base.item = b.items;
  } else if (b.content !== undefined && b.content !== null) {
    base.content = b.content;
  }

  // Add nested children for row containers
  if (b.type === "row" && b.children?.length) {
    base.include = b.children.map((child) => buildIncludeElement(child));
  }

  return base;
}

module.exports = { parseCBankXML, buildCBankXML, parseCBlendXML, buildCBlendXML };

