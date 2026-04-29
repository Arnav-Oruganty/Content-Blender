import { useState } from "react";
import toast from "react-hot-toast";
import { useCBank } from "../hooks/useCBank";
import { exportApi } from "../utils/api";
import { getBlockMeta, downloadBlob } from "../utils/blocks";
import { ImageBlockEditor } from "../components/ImageBlockEditor";

const VALID_TYPES = ["title","section","paragraph","image","quote","list","hero","card"];

function buildCBankXMLPreview(blocks) {
  const lines = [`<?xml version="1.0" encoding="UTF-8"?>`, `<cbank>`];
  blocks.forEach((b) => {
    lines.push(`  <cblock id="${b.id}" type="${b.type}" version="${b.version || "1.0"}">`);
    if (b.items?.length) {
      b.items.forEach((it) => lines.push(`    <item>${it}</item>`));
    } else {
      lines.push(`    <content>${b.content || ""}</content>`);
    }
    lines.push(`  </cblock>`);
  });
  lines.push(`</cbank>`);
  return lines.join("\n");
}

const EMPTY_FORM = { id: "", type: "paragraph", name: "", content: "", items: "", version: "1.0", sourceType: "url", url: "", altText: "", caption: "" };

export default function CbankPage() {
  // Uses the SAME shared context as ComposerPage — adding here shows up there instantly
  const { blocks, loading, create, update, remove } = useCBank();

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [err,    setErr]    = useState("");
  const [search, setSearch] = useState("");

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function validate() {
    if (!form.id.trim())   return "Block ID is required";
    if (!form.type)        return "Type is required";
    if (!form.name.trim()) return "Name / label is required";
    if (!editId && blocks.find((b) => b.id === form.id.trim()))
      return `ID "${form.id}" already exists in CBank`;
    return "";
  }

  async function handleSubmit() {
    const e = validate();
    if (e) { setErr(e); return; }
    setErr("");

    const isListLike = ["list", "card"].includes(form.type);
    const isImage = form.type === "image";
    
    const payload = {
      id:      form.id.trim(),
      type:    form.type,
      name:    form.name.trim(),
      version: form.version.trim() || "1.0",
      content: isListLike ? "" : form.content.trim(),
      items:   isListLike
        ? form.items.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    // Add image-specific fields
    if (isImage) {
      payload.sourceType = form.sourceType;
      payload.url = form.url.trim();
      payload.altText = form.altText.trim();
      payload.caption = form.caption.trim();
    }

    try {
      if (editId) {
        await update(editId, payload);
        setEditId(null);
      } else {
        await create(payload);
      }
      setForm(EMPTY_FORM);
    } catch (ex) {
      setErr(ex.response?.data?.errors?.[0]?.msg || ex.response?.data?.error || ex.message);
    }
  }

  function startEdit(block) {
    setEditId(block.id);
    setForm({
      id:      block.id,
      type:    block.type,
      name:    block.name || "",
      content: block.content || "",
      items:   (block.items || []).join("\n"),
      version: block.version || "1.0",
      sourceType: block.sourceType || "url",
      url: block.url || "",
      altText: block.altText || "",
      caption: block.caption || "",
    });
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErr("");
  }

  async function handleExportCBank() {
    try {
      const blob = await exportApi.cbankXml();
      downloadBlob(blob, "cbank.xml");
    } catch {
      toast.error("Export failed");
    }
  }

  const isListLike = ["list", "card"].includes(form.type);

  // Filtered list for the registry
  const q = search.toLowerCase().trim();
  const filtered = q
    ? blocks.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(q) ||
          b.type.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      )
    : blocks;

  return (
    <div className="cbank-page">
      <div className="page-header">
        <h1>CBank — Block Registry</h1>
        <p>
          Create and manage reusable content blocks. Blocks added here appear&nbsp;
          <strong>instantly</strong> in the Composer's drag panel.
        </p>
      </div>

      <div className="two-col">
        {/* ── Form ── */}
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {editId
              ? <><span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 4, padding: "1px 7px", fontSize: 12 }}>Editing</span> {editId}</>
              : "Add new CBlock"
            }
          </h3>

          <div className="field">
            <label>Block ID <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none" }}>(unique key)</span></label>
            <input
              value={form.id}
              onChange={(e) => setField("id", e.target.value)}
              placeholder="e.g. intro-para, hero-main"
              disabled={!!editId}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setField("type", e.target.value)}>
                {VALID_TYPES.map((t) => {
                  const meta = getBlockMeta(t);
                  return <option key={t} value={t}>{meta.label}</option>;
                })}
              </select>
            </div>
            <div className="field">
              <label>Version</label>
              <input value={form.version} onChange={(e) => setField("version", e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Name / label <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none" }}>(shown in Composer)</span></label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Intro paragraph, Product hero"
            />
          </div>

          {isListLike ? (
            <div className="field">
              <label>Items <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none" }}>(one per line)</span></label>
              <textarea
                rows={4}
                value={form.items}
                onChange={(e) => setField("items", e.target.value)}
                placeholder={"Item one\nItem two\nItem three"}
              />
            </div>
          ) : form.type === "image" ? (
            <>
              <ImageBlockEditor
                block={{
                  sourceType: form.sourceType,
                  url: form.url,
                  altText: form.altText,
                  caption: form.caption,
                }}
                onUpdate={(updates) => {
                  setField("sourceType", updates.sourceType);
                  setField("url", updates.url);
                  setField("altText", updates.altText);
                  setField("caption", updates.caption);
                }}
              />
            </>
          ) : (
            <div className="field">
              <label>Default content</label>
              <textarea
                rows={3}
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
                placeholder="Default text that appears when this block is dragged into a document…"
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1, justifyContent: "center" }}>
              {editId ? "Update block" : "+ Add to CBank"}
            </button>
            {editId && <button className="btn" onClick={cancelEdit}>Cancel</button>}
          </div>

          {err && <div className="error-msg">{err}</div>}

          {!editId && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-1)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-1)" }}>💡 Tip:</strong> After adding a block, switch to the <strong>Composer</strong> tab — your block will appear in the CBank panel immediately, ready to drag into any document.
            </div>
          )}
        </div>

        {/* ── Right column: XML preview + block list ── */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>CBank XML (live)</h3>
              <button className="btn" onClick={handleExportCBank}>⬇ Download</button>
            </div>
            <div className="xml-preview">
              {loading
                ? <div className="loading">Loading…</div>
                : <pre>{buildCBankXMLPreview(blocks)}</pre>
              }
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>
                Registered blocks&nbsp;
                <span className="pill">{blocks.length}</span>
              </h3>
            </div>

            {/* Search within registry */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-3)", pointerEvents: "none" }}>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter blocks…"
                style={{ width: "100%", padding: "5px 8px 5px 24px", border: "1px solid var(--border-2)", borderRadius: 6, fontSize: 12, background: "var(--bg-1)", color: "var(--text-1)", outline: "none", fontFamily: "var(--font)" }}
              />
            </div>

            {loading && <div className="loading">Loading…</div>}

            {filtered.map((b) => {
              const meta = getBlockMeta(b.type);
              return (
                <div key={b.id} className="bank-list-item">
                  <div className={"block-icon " + meta.colorClass}>{meta.icon}</div>
                  <div className="bank-item-info">
                    <div className="bank-item-name">{b.name || meta.label}</div>
                    <div className="bank-item-meta">
                      {b.id} · {b.type} · v{b.version}
                      {b.type === "image" && b.url && (
                        <>
                          <br />
                          <span style={{ fontSize: 10, color: "var(--accent)" }}>📷 {b.url}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: "3px 8px" }}
                    onClick={() => startEdit(b)}
                  >Edit</button>
                  <button className="del-btn" onClick={() => remove(b.id)}>✕</button>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div className="empty-state" style={{ padding: "16px 0" }}>
                {search ? `No blocks match "${search}"` : "No blocks yet — add one above"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
