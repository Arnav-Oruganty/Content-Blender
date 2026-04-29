import { useState } from "react";
import { getBlockMeta } from "../utils/blocks";
import { ImageBlockEditor } from "./ImageBlockEditor";

export function EditorPanel({ block, idx, onUpdate }) {
  const [expanded, setExpanded] = useState(true);

  if (!block) {
    return (
      <div style={{ padding: "12px", color: "var(--text-3)", fontSize: 13 }}>
        Select a block to edit
      </div>
    );
  }

  const meta = getBlockMeta(block.type);

  return (
    <div>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={"badge " + meta.colorClass}>{block.type}</span>
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{block.uid}</span>
        <span style={{ fontSize: 10, color: "var(--text-3)" }}>{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <>
          {block.type === "row" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Columns
              </label>
              <select
                value={block.columns || 2}
                onChange={(e) => onUpdate(idx, { columns: parseInt(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 12,
                }}
              >
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
              </select>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Gap (px)
              </label>
              <input
                type="text"
                value={block.gap || "16px"}
                onChange={(e) => onUpdate(idx, { gap: e.target.value })}
                placeholder="16px"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ marginTop: 12, padding: "10px", background: "var(--bg-1)", borderRadius: 6, fontSize: 12, color: "var(--text-2)" }}>
                <strong>Items:</strong> {block.children?.length || 0}
              </div>
            </div>
          ) : block.type === "image" ? (
            <ImageBlockEditor
              block={block}
              onUpdate={(updates) => onUpdate(idx, updates)}
            />
          ) : block.type === "title" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Title
              </label>
              <input
                type="text"
                value={block.content || ""}
                onChange={(e) => onUpdate(idx, { content: e.target.value })}
                placeholder="Title text…"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : block.type === "section" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Section Title
              </label>
              <input
                type="text"
                value={block.content || ""}
                onChange={(e) => onUpdate(idx, { content: e.target.value })}
                placeholder="Section heading…"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : block.type === "paragraph" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Paragraph
              </label>
              <textarea
                value={block.content || ""}
                onChange={(e) => onUpdate(idx, { content: e.target.value })}
                placeholder="Paragraph content…"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 80,
                }}
              />
            </div>
          ) : block.type === "quote" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Quote
              </label>
              <textarea
                value={block.content || ""}
                onChange={(e) => onUpdate(idx, { content: e.target.value })}
                placeholder="Quote text…"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 60,
                }}
              />
            </div>
          ) : block.type === "list" || block.type === "card" ? (
            <div style={{ padding: "12px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
                Items (one per line)
              </label>
              <textarea
                value={(block.items || []).join("\n")}
                onChange={(e) => onUpdate(idx, { items: e.target.value.split("\n").filter(Boolean) })}
                placeholder="Item 1\nItem 2\nItem 3"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font)",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 80,
                }}
              />
            </div>
          ) : (
            <div style={{ padding: "12px", color: "var(--text-3)", fontSize: 12 }}>
              Block editing not available for this type
            </div>
          )}
        </>
      )}
    </div>
  );
}
