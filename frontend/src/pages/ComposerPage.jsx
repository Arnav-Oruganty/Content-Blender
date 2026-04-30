import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useCBank }  from "../hooks/useCBank";
import { useCBlend } from "../hooks/useCBlend";
import { useCustomLayouts } from "../hooks/useCustomLayouts";
import { exportApi } from "../utils/api";
import { BLOCK_GROUPS, LAYOUTS, getBlockMeta, uid, downloadBlob, createRowBlock } from "../utils/blocks";
import { buildCBlendXML } from "../utils/xmlClient";
import { RowBlock } from "../components/RowBlock";
import { EditorPanel } from "../components/EditorPanel";
import { ImageBlockEditor } from "../components/ImageBlockEditor";
import { LayoutSaveDialog } from "../components/LayoutSaveDialog";

const CBANK_SCHEMA = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="cbank">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="cblock" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="content" type="xs:string"/>
              <xs:element name="item" type="xs:string"
                minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="id"      type="xs:string" use="required"/>
            <xs:attribute name="type"    use="required">
              <xs:simpleType><xs:restriction base="xs:string">
                <xs:enumeration value="title"/>
                <xs:enumeration value="section"/>
                <xs:enumeration value="paragraph"/>
                <xs:enumeration value="image"/>
                <xs:enumeration value="quote"/>
                <xs:enumeration value="list"/>
                <xs:enumeration value="hero"/>
                <xs:enumeration value="card"/>
              </xs:restriction></xs:simpleType>
            </xs:attribute>
            <xs:attribute name="version" type="xs:string" default="1.0"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

const CBLEND_SCHEMA = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="cblend">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="meta">
          <xs:complexType>
            <xs:attribute name="title"   type="xs:string"/>
            <xs:attribute name="layout"  type="xs:string"/>
            <xs:attribute name="created" type="xs:dateTime"/>
          </xs:complexType>
        </xs:element>
        <xs:element name="include" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="content" type="xs:string" minOccurs="0"/>
              <xs:element name="item"    type="xs:string"
                minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="ref"  type="xs:string"/>
            <xs:attribute name="type" type="xs:string"/>
            <xs:attribute name="uid"  type="xs:string"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
      <xs:attribute name="id" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

// ── Layout picker ─────────────────────────────────────────────────────────────
function LayoutPicker({ selected, onSelect, customLayouts = [] }) {
  return (
    <div style={{ padding: "10px 10px 6px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
        Layouts
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {LAYOUTS.map((l) => (
          <div
            key={l.id}
            onClick={() => onSelect(l)}
            title={l.desc}
            style={{
              border: selected === l.id ? `2px solid ${l.accent}` : "1px solid var(--border)",
              borderRadius: 8,
              padding: "7px 6px 6px",
              cursor: "pointer",
              background: selected === l.id ? l.accent + "12" : "var(--bg-0)",
              transition: "all .14s",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{l.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: selected === l.id ? l.accent : "var(--text-1)", lineHeight: 1.2 }}>{l.name}</div>
          </div>
        ))}
      </div>

      {/* Custom Layouts */}
      {customLayouts && customLayouts.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
            My Layouts
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {customLayouts.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                title={t.desc}
                style={{
                  border: selected === t.id ? `2px solid ${t.accent}` : "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "7px 6px 6px",
                  cursor: "pointer",
                  background: selected === t.id ? t.accent + "12" : "var(--bg-0)",
                  transition: "all .14s",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{t.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: selected === t.id ? t.accent : "var(--text-1)", lineHeight: 1.2 }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CBank panel with search ───────────────────────────────────────────────────
function CbankPanel({ cbankBlocks, loading, onDragStart }) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase().trim();
  const filtered = q
    ? cbankBlocks.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(q) ||
          b.type.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          (b.content || "").toLowerCase().includes(q)
      )
    : cbankBlocks;

  const known = new Set(["title", "section", "paragraph", "image", "hero", "quote", "list", "card"]);

  // Build groups: predefined + custom
  const groups = [
    ...["Typography", "Media", "Content"].map((label, gi) => {
      const types = [
        ["title","section","paragraph"],
        ["image","hero"],
        ["quote","list","card"],
      ][gi];
      return { label, blocks: filtered.filter((b) => types.includes(b.type)) };
    }),
    {
      label: "Custom",
      blocks: filtered.filter((b) => !known.has(b.type)),
    },
  ].filter((g) => g.blocks.length > 0);

  return (
    <>
      {/* Search bar */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-3)", pointerEvents: "none" }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks…"
            style={{
              width: "100%", padding: "5px 8px 5px 24px",
              border: "1px solid var(--border-2)", borderRadius: 6,
              fontSize: 12, background: "var(--bg-1)",
              color: "var(--text-1)", outline: "none",
              fontFamily: "var(--font)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 13, padding: 0, lineHeight: 1 }}
            >×</button>
          )}
        </div>
        {q && (
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{q}"
          </div>
        )}
      </div>

      {/* Block list */}
      <div className="panel-body">
        {loading && <div className="loading">Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ padding: "20px 0" }}>
            <span>No blocks match "{search}"</span>
          </div>
        )}

        {groups.map((grp) => (
          <div key={grp.label} className="block-group">
            <div className="block-group-label">{grp.label}</div>
            {grp.blocks.map((b) => {
              const meta = getBlockMeta(b.type);
              const displayName = b.name || meta.label;
              return (
                <div
                  key={b.id}
                  className="cblock-card"
                  draggable
                  title={`${b.id} · v${b.version}\n${b.content ? b.content.slice(0, 60) : ""}`}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "copy"; onDragStart(b); }}
                >
                  <div className={"block-icon " + meta.colorClass}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="block-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {/* Highlight match */}
                      {q ? highlightMatch(displayName, q) : displayName}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{b.id} · {b.type}</div>
                  </div>
                  <span className="block-meta">v{b.version}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function highlightMatch(text, q) {
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#FEF08A", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ── Blend item editor ─────────────────────────────────────────────────────────
function BlendItemEditor({ item, idx, onUpdate, onRemove, onDragStart, onDragOver, onDrop, isDragOver, onSelect, onAddToRow, onRemoveFromRow, isSelected, selectedChildIdx, onSelectChild, dragSrc, onDropIntoRow }) {
  const meta = getBlockMeta(item.type);

  function handleContentChange(val) { onUpdate(idx, { content: val }); }
  function handleItemsChange(val)   { onUpdate(idx, { items: val.split("\n") }); }

  // Row container - render with RowBlock component
  if (item.type === "row") {
    return (
      <RowBlock
        block={item}
        idx={idx}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onSelectChild={onSelectChild}
        onAddToRow={onAddToRow}
        onRemoveFromRow={onRemoveFromRow}
        isDragOver={isDragOver}
        selectedChildIdx={selectedChildIdx}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        dragSrc={dragSrc}
        onDropIntoRow={onDropIntoRow}
      />
    );
  }

  let editor;
  if (item.type === "title")
    editor = <input className="input-title" value={item.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Title text…" />;
  else if (item.type === "section")
    editor = <input className="input-section" value={item.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Section heading…" />;
  else if (item.type === "image")
    editor = (
      <>
        <div className="image-thumb">▣ {item.url || item.content || "image.jpg"}</div>
        {item.url && (
          <img src={item.url} alt={item.altText || "preview"} style={{ marginTop: 6, maxWidth: "100%", maxHeight: 120, borderRadius: 4 }} />
        )}
      </>
    );
  else if (item.type === "quote")
    editor = <textarea className="input-quote" rows={2} value={item.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Quote text…" />;
  else if (item.type === "list" || item.type === "card")
    editor = <textarea rows={3} value={(item.items || []).join("\n")} onChange={(e) => handleItemsChange(e.target.value)} placeholder="One item per line…" />;
  else if (item.type === "hero")
    editor = <textarea rows={2} value={item.content} onChange={(e) => handleContentChange(e.target.value)} placeholder={"Headline\nSubtitle"} />;
  else
    editor = <textarea rows={3} value={item.content} onChange={(e) => handleContentChange(e.target.value)} placeholder="Content…" />;

  return (
    <div
      className={"blend-item" + (isDragOver ? " drag-over" : "") + (isSelected ? " selected" : "")}
      draggable
      onClick={() => onSelect && onSelect(idx)}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(idx); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(idx); }}
      style={{ 
        width: item.width || "100%",
        minHeight: item.height || "auto",
      }}
    >
      <div className="blend-item-head">
        <span className="drag-handle" title="Drag to reorder">⠿</span>
        <span className={"badge " + meta.colorClass}>{item.type}</span>
        <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 4 }}>{item.uid}</span>
        <button className="del-btn" style={{ marginLeft: "auto" }} onClick={() => onRemove(idx)}>✕</button>
      </div>
      <div className="blend-item-body" style={{ minHeight: "80px", position: "relative" }}>
        {editor}
      </div>
    </div>
  );
}

// ── Preview pane ──────────────────────────────────────────────────────────────
function PreviewPane({ blocks }) {
  if (!blocks.length)
    return <div className="empty-state" style={{ padding: 20 }}>Nothing to preview yet</div>;

  const renderBlock = (b, i) => {
    const c = b.content || "";
    const items = b.items || [];
    let content;
    
    if (b.type === "title")     
      content = <div className="prev-h1">{c}</div>;
    else if (b.type === "section")   
      content = <div className="prev-h2">{c}</div>;
    else if (b.type === "paragraph") 
      content = <p className="prev-p">{c}</p>;
    else if (b.type === "image")     
      content = (
        <figure className="cb-image">
          {b.url ? (
            <img src={b.url} alt={b.altText || "image"} style={{ width: "100%", borderRadius: 4 }} />
          ) : (
            <div className="prev-img">▣ No image</div>
          )}
          {b.caption && <figcaption style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, fontStyle: "italic" }}>{b.caption}</figcaption>}
        </figure>
      );
    else if (b.type === "quote")     
      content = <div className="prev-q">{c}</div>;
    else if (b.type === "list")      
      content = <ul className="prev-ul">{items.map((it, j) => <li key={j}>{it}</li>)}</ul>;
    else if (b.type === "row") 
      content = (
        <div className="cb-row" style={{ display: "flex", gap: b.gap || "16px", flexWrap: "wrap", marginBottom: 12 }}>
          {(b.children || []).map((child, ci) => (
            <div key={ci} style={{ flex: `1 1 calc(${100 / (b.columns || 2)}% - ${b.gap || "16px"})`, minWidth: "200px" }}>
              {renderBlock(child, ci).content}
            </div>
          ))}
        </div>
      );
    else if (b.type === "hero") {
      const lines = c.split("\n");
      content = <div className="prev-hero"><h2>{lines[0]}</h2>{lines[1] && <p>{lines[1]}</p>}</div>;
    }
    else if (b.type === "card") {
      const cards = items.length ? items : c.split("\n").filter(Boolean);
      content = <div className="prev-cards">{cards.map((ci, j) => <div key={j} className="prev-card">{ci}</div>)}</div>;
    }
    else content = <p className="prev-p">{c}</p>;
    
    return {
      content,
      element: (
        <div key={i} style={{ background: "var(--bg-0)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px", overflow: "hidden", width: b.width || "100%", minHeight: b.height || "auto" }}>
          {content}
        </div>
      )
    };
  };

  return (
    <div className="preview-body" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", alignItems: "flex-start" }}>
      {blocks.map((b, i) => renderBlock(b, i).element)}
    </div>
  );
}

// ── Main composer ─────────────────────────────────────────────────────────────
export default function ComposerPage() {
  const { blendId: routeBlendId } = useParams();
  const navigate = useNavigate();

  // Shared CBank state — same instance as CbankPage
  const { blocks: cbankBlocks, loading: cbankLoading } = useCBank();
  const blend = useCBlend();
  const { customLayouts, saveAsLayout, deleteLayout, updateLayout } = useCustomLayouts();

  const [activeTab,     setActiveTab]     = useState("preview");
  const [dragSrc,       setDragSrc]       = useState(null);
  const [dragOver,      setDragOver]      = useState(null);
  const [xmlText,       setXmlText]       = useState("");
  const [layoutMode,    setLayoutMode]    = useState("horizontal");
  const [leftVisible,   setLeftVisible]   = useState(true);
  const [rightVisible,  setRightVisible]  = useState(true);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null);
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);
  const [selectedChildIdx, setSelectedChildIdx] = useState(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(296); // Initial width in px
  const [isResizing, setIsResizing] = useState(false);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

  // Load existing blend if navigated to /composer/:id
  useEffect(() => {
    if (routeBlendId) {
      if (routeBlendId !== blend.blendId) {
        blend.load(routeBlendId).catch(() => toast.error("Could not load document"));
      }
    } else {
      // Navigated to /composer (Create new document)
      // If the current draft belongs to a saved document, clear it for a blank slate.
      // If it has no ID, it's an unsaved draft of a new document, so we keep it!
      if (blend.blendId) {
        blend.clear();
      }
    }
  }, [routeBlendId]);

  // Regenerate XML preview whenever tab or blocks change
  useEffect(() => {
    if (activeTab === "xml") {
      setXmlText(buildCBlendXML(blend.buildDoc()));
    }
  }, [activeTab, blend.blocks, blend.blendTitle, blend.layout]);

  // ── Drag handlers ──────────────────────────────────────────────────────
  const handleBankDragStart = useCallback((block) => {
    setDragSrc({ fromBank: true, block });
  }, []);

  const handleBlendDragStart = useCallback((idx) => {
    setDragSrc({ fromBank: false, idx });
  }, []);

  const handleDragOver = useCallback((idx) => {
    setDragOver(idx);
  }, []);

  const handleDrop = useCallback((targetIdx) => {
    if (!dragSrc) return;
    if (dragSrc.fromBank) {
      blend.addBlock(dragSrc.block, targetIdx);
    } else {
      blend.reorder(dragSrc.idx, targetIdx);
    }
    setDragSrc(null);
    setDragOver(null);
  }, [dragSrc, blend]);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    if (dragSrc?.fromBank) {
      blend.addBlock(dragSrc.block);
    }
    setDragSrc(null);
    setDragOver(null);
  }, [dragSrc, blend]);

  // ── Child block handlers ───────────────────────────────────────────────
  const handleSelectChild = useCallback((rowIdx, childIdx) => {
    setSelectedRowIdx(rowIdx);
    setSelectedChildIdx(childIdx);
    setSelectedBlockIdx(null); // Deselect top-level block when selecting child
  }, []);

  const handleUpdateChild = useCallback((rowIdx, childIdx, patch) => {
    blend.updateBlock(rowIdx, {
      children: blend.blocks[rowIdx].children.map((child, i) =>
        i === childIdx ? { ...child, ...patch } : child
      ),
    });
  }, [blend]);

  // ── Handle dropping blocks into rows ────────────────────────────────────
  const handleDropIntoRow = useCallback((rowIdx, block) => {
    blend.addToRow(rowIdx, block);
    setDragSrc(null);
    setDragOver(null);
  }, [blend]);

  // ── Resize right panel ─────────────────────────────────────────────────
  const handleResizeDragStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // Calculate new width: window width - mouse X position
      const newWidth = Math.max(200, Math.min(window.innerWidth - 400, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ── Export helpers ─────────────────────────────────────────────────────
  async function ensureSaved() {
    const saved = await blend.save();
    if (saved && !routeBlendId) {
      navigate(`/composer/${saved.id}`, { replace: true });
    }
    return saved;
  }

  async function handleExportXml() {
    const saved = await ensureSaved();
    const id = saved?.id || blend.blendId;
    if (!id) return;
    const blob = await exportApi.blendXml(id);
    downloadBlob(blob, `${id}.xml`);
  }

  async function handleExportHtml() {
    const saved = await ensureSaved();
    const id = saved?.id || blend.blendId;
    if (!id) return;
    const blob = await exportApi.blendHtml(id);
    downloadBlob(blob, `${id}.html`);
  }

  async function handleExportPdf() {
    try {
      const saved = await ensureSaved();
      const id = saved?.id || blend.blendId;
      if (!id) {
        toast.error("Please save the document first");
        return;
      }
      
      const toastId = toast.loading("Generating PDF...");
      const blob = await exportApi.blendPdf(id);
      
      if (!blob || blob.size === 0) {
        toast.error("Failed to generate PDF - empty response", { id: toastId });
        return;
      }
      
      downloadBlob(blob, `${id}.pdf`);
      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error(`Export failed: ${err.message || "Unknown error"}`);
    }
  }

  function handleRename() {
    const n = window.prompt("Document name:", blend.blendTitle);
    if (n?.trim()) blend.setBlendTitle(n.trim());
  }

  function handleSaveLayout(name, description, emoji, accent, blocks) {
    const blocksToSave = blocks || blend.blocks;
    const saved = saveAsLayout(name, description, blocksToSave, emoji, accent);
    if (saved) {
      toast.success(`Layout "${name}" saved`);
      setShowLayoutDialog(false);
    }
  }

  function handleUpdateLayout(layoutId, updates) {
    updateLayout(layoutId, updates);
    toast.success("Layout updated");
    setShowLayoutDialog(false);
  }

  return (
    <div
      className={`composer-grid composer-${layoutMode}`}
      style={{
        gridTemplateColumns: layoutMode === "horizontal" ? `252px 1fr ${rightPanelWidth}px` : undefined,
      }}
    >
      {/* ── LEFT: Layouts + CBank ── */}
      {(layoutMode === "horizontal" || leftVisible) && (
      <div className="panel composer-left" style={{ display: "flex", flexDirection: "column" }}>
        <div className="panel-header">
          <div>
            <div className="panel-label">CBank</div>
            <div className="panel-title">
              Blocks&nbsp;<span className="pill">{cbankBlocks.length}</span>
            </div>
          </div>
        </div>

        <LayoutPicker selected={blend.layout} onSelect={blend.applyLayout} customLayouts={customLayouts} />

        <div style={{ borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <CbankPanel
            cbankBlocks={cbankBlocks}
            loading={cbankLoading}
            onDragStart={handleBankDragStart}
          />
        </div>
      </div>
      )}

      {/* ── CENTER: Canvas ── */}
      <div className="panel" style={{ background: "var(--bg-1)", display: "flex", flexDirection: "column" }}>
        <div className="panel-header">
          <div>
            <div className="panel-label">CBlend</div>
            <div
              className="panel-title"
              style={{ cursor: "pointer" }}
              onClick={handleRename}
              title="Click to rename"
            >
              {blend.blendTitle}&nbsp;<span style={{ fontSize: 11, color: "var(--text-3)" }}>✎</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pill">{blend.blocks.length} block{blend.blocks.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div
          className="blend-canvas"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "10px",
            flex: 1,
            overflow: "auto",
            background: "var(--bg-1)",
            alignItems: "flex-start",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {blend.blocks.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: `1 / -1`, placeSelf: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              <span>Drag blocks from CBank</span>
              <span style={{ fontSize: 11 }}>or pick a layout above</span>
            </div>
          ) : (
            blend.blocks.map((item, idx) => (
              <BlendItemEditor
                key={item.uid}
                item={item}
                idx={idx}
                onUpdate={blend.updateBlock}
                onRemove={blend.removeBlock}
                onDragStart={handleBlendDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOver === idx}
                onSelect={setSelectedBlockIdx}
                onAddToRow={blend.addToRow}
                onRemoveFromRow={blend.removeFromRow}
                isSelected={selectedBlockIdx === idx}
                selectedChildIdx={selectedRowIdx === idx ? selectedChildIdx : null}
                onSelectChild={(childIdx) => handleSelectChild(idx, childIdx)}
                dragSrc={dragSrc}
                onDropIntoRow={handleDropIntoRow}
              />
            ))
          )}
        </div>

        <div className="blend-toolbar">
          <button className="btn" onClick={() => blend.addRow(2)}>+ Row</button>
          <button className="btn" onClick={blend.clear}>Clear</button>
          <button className="btn" onClick={handleRename}>Rename</button>
          
          <select 
            className="btn" 
            style={{ appearance: "auto", paddingRight: "24px" }}
            value={blend.copyMode} 
            onChange={(e) => blend.setCopyMode(e.target.value)}
            title="Shallow uses references to CBank, Deep embeds content completely"
          >
            <option value="shallow">Shallow Copy</option>
            <option value="deep">Deep Copy</option>
          </select>
          
          <button className="btn" onClick={ensureSaved} disabled={blend.saving}>
            {blend.saving ? "Saving…" : "Save"}
          </button>
          <button className="btn" onClick={() => setShowLayoutDialog(true)}>📐 Layout</button>
          <button className="btn btn-primary" onClick={handleExportXml}>Export XML</button>
          <button className="btn" onClick={handleExportHtml}>Export HTML</button>
          <button className="btn" onClick={handleExportPdf}>Export PDF</button>
        </div>
      </div>

      {/* ── RIGHT: Preview / XML / Editor / Schema ── */}
      {(layoutMode === "horizontal" || rightVisible) && (
      <div
        className="panel composer-right"
        style={{
          position: "relative",
          borderLeft: `6px solid ${isResizing ? "var(--accent)" : "var(--border)"}`,
          cursor: isResizing ? "col-resize" : "auto",
        }}
        onMouseDown={(e) => {
          if (e.clientX - e.currentTarget.getBoundingClientRect().left < 6) {
            handleResizeDragStart(e);
          }
        }}
      >
        <div className="tab-row">
          {["preview", "editor", "xml", "schema"].map((t) => (
            <div
              key={t}
              className={"tab" + (activeTab === t ? " active" : "")}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {activeTab === "preview" && <PreviewPane blocks={blend.blocks} />}

        {activeTab === "editor" && (
          <div className="panel-body">
            {selectedChildIdx !== null && selectedRowIdx !== null ? (
              <EditorPanel
                block={blend.blocks[selectedRowIdx]?.children?.[selectedChildIdx] || null}
                idx={selectedChildIdx}
                onUpdate={(idx, patch) => handleUpdateChild(selectedRowIdx, idx, patch)}
                isChild={true}
              />
            ) : (
              <EditorPanel
                block={selectedBlockIdx !== null ? blend.blocks[selectedBlockIdx] : null}
                idx={selectedBlockIdx}
                onUpdate={blend.updateBlock}
              />
            )}
          </div>
        )}

        {activeTab === "xml" && (
          <div className="xml-pre" style={{ margin: 0, borderRadius: 0, flex: 1, overflow: "auto" }}>
            {xmlText || buildCBlendXML(blend.buildDoc())}
          </div>
        )}

        {activeTab === "schema" && (
          <div className="panel-body">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>CBank XSD</div>
              <div className="xml-preview"><pre>{CBANK_SCHEMA}</pre></div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>CBlend XSD</div>
              <div className="xml-preview"><pre>{CBLEND_SCHEMA}</pre></div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Layout Save Dialog */}
      {showLayoutDialog && (
        <LayoutSaveDialog
          blocks={blend.blocks}
          onSave={handleSaveLayout}
          onCancel={() => setShowLayoutDialog(false)}
          customLayouts={customLayouts}
          onDeleteLayout={deleteLayout}
          onUpdateLayout={handleUpdateLayout}
        />
      )}
    </div>
  );
}
