import { useState, useCallback } from "react";
import { uid } from "../utils/blocks";

export function LayoutSaveDialog({ blocks, onSave, onCancel, customLayouts, onDeleteLayout, onUpdateLayout }) {
  const [step, setStep] = useState("save"); // "save", "manage", or "edit"
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📐");
  const [accent, setAccent] = useState("#6B7280");
  
  // For layout editor (rows/columns)
  const [layoutRows, setLayoutRows] = useState([
    { id: `row-${uid()}`, columns: 1 },
  ]);
  
  // For editing existing layout
  const [editingLayout, setEditingLayout] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEmoji, setEditEmoji] = useState("📐");
  const [editAccent, setEditAccent] = useState("#6B7280");
  const [editRows, setEditRows] = useState([]);

  const emojis = ["📐", "📋", "📰", "🎨", "🚀", "📊", "💡", "🎯", "⭐", "📌"];
  const colors = ["#6B7280", "#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#EA580C"];

  // Generate blocks from layout rows
  const generateBlocksFromRows = (rows) => {
    const generatedBlocks = [];
    rows.forEach((row) => {
      // Create a row container with empty children (no example blocks)
      const rowBlock = {
        type: "row",
        layout: "horizontal",
        columns: row.columns,
        gap: "16px",
        children: [],
      };
      
      generatedBlocks.push(rowBlock);
    });
    return generatedBlocks;
  };

  const handleSave = () => {
    if (name.trim()) {
      const generatedBlocks = generateBlocksFromRows(layoutRows);
      onSave(name, description, emoji, accent, generatedBlocks);
      setName("");
      setDescription("");
      setEmoji("📐");
      setAccent("#6B7280");
      setLayoutRows([{ id: `row-${uid()}`, columns: 1 }]);
    }
  };

  const handleStartEdit = (layout) => {
    setEditingLayout(layout);
    setEditName(layout.name);
    setEditDescription(layout.desc);
    setEditEmoji(layout.emoji);
    setEditAccent(layout.accent);
    // Convert blocks back to row structure
    const rows = [];
    layout.blocks.forEach((block) => {
      if (block.type === "row" && block.columns) {
        rows.push({ id: block.id || `row-${uid()}`, columns: block.columns });
      }
    });
    setEditRows(rows.length > 0 ? rows : [{ id: `row-${uid()}`, columns: 1 }]);
    setStep("edit");
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editingLayout) {
      const generatedBlocks = generateBlocksFromRows(editRows);
      onUpdateLayout(editingLayout.id, {
        name: editName,
        desc: editDescription,
        emoji: editEmoji,
        accent: editAccent,
        blocks: generatedBlocks,
      });
      setStep("manage");
      setEditingLayout(null);
      setEditRows([]);
    }
  };

  const addRow = () => {
    setLayoutRows([...layoutRows, { id: `row-${uid()}`, columns: 1 }]);
  };

  const removeRow = (rowId) => {
    if (layoutRows.length > 1) {
      setLayoutRows(layoutRows.filter((r) => r.id !== rowId));
    }
  };

  const updateRowColumns = (rowId, columns) => {
    setLayoutRows(layoutRows.map((r) => r.id === rowId ? { ...r, columns: Math.max(1, Math.min(4, columns)) } : r));
  };

  const addEditRow = () => {
    setEditRows([...editRows, { id: `row-${uid()}`, columns: 1 }]);
  };

  const removeEditRow = (rowId) => {
    if (editRows.length > 1) {
      setEditRows(editRows.filter((r) => r.id !== rowId));
    }
  };

  const updateEditRowColumns = (rowId, columns) => {
    setEditRows(editRows.map((r) => r.id === rowId ? { ...r, columns: Math.max(1, Math.min(4, columns)) } : r));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--bg-0)",
          borderRadius: 12,
          padding: 0,
          width: "90%",
          maxWidth: step === "save" ? "500px" : "450px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setStep("save");
              setEditingLayout(null);
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: step === "save" ? "var(--bg-1)" : "transparent",
              border: "none",
              borderBottom: step === "save" ? "2px solid var(--accent)" : "none",
              color: step === "save" ? "var(--accent)" : "var(--text-2)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all .2s",
            }}
          >
            Save as Layout
          </button>
          <button
            onClick={() => {
              setStep("manage");
              setEditingLayout(null);
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: step === "manage" ? "var(--bg-1)" : "transparent",
              border: "none",
              borderBottom: step === "manage" ? "2px solid var(--accent)" : "none",
              color: step === "manage" ? "var(--accent)" : "var(--text-2)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all .2s",
            }}
          >
            My Layouts ({customLayouts.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {step === "save" ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Layout Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product Page, Blog Post"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "var(--font)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "var(--font)",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Layout Structure
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {layoutRows.map((row, idx) => (
                    <div
                      key={row.id}
                      style={{
                        padding: 10,
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        background: "var(--bg-1)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>Row {idx + 1}</span>
                        {layoutRows.length > 1 && (
                          <button
                            onClick={() => removeRow(row.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-3)",
                              cursor: "pointer",
                              fontSize: 14,
                              padding: "2px 6px",
                              transition: "color .2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.color = "#DC2626")}
                            onMouseLeave={(e) => (e.target.style.color = "var(--text-3)")}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "var(--text-2)" }}>Columns:</label>
                        <select
                          value={row.columns}
                          onChange={(e) => updateRowColumns(row.id, parseInt(e.target.value))}
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            fontSize: 12,
                            background: "var(--bg-0)",
                            color: "var(--text-1)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="1">1 Column</option>
                          <option value="2">2 Columns</option>
                          <option value="3">3 Columns</option>
                          <option value="4">4 Columns</option>
                        </select>
                      </div>

                      {/* Visual preview of columns */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {Array.from({ length: row.columns }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              minHeight: 40,
                              background: "var(--bg-0)",
                              border: "1px dashed var(--border)",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              color: "var(--text-3)",
                            }}
                          >
                            Col {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={addRow}
                    style={{
                      padding: "10px 12px",
                      border: "1px dashed var(--border)",
                      background: "var(--bg-1)",
                      color: "var(--accent)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all .2s",
                    }}
                    onMouseEnter={(e) => (e.target.background = "var(--accent)12")}
                    onMouseLeave={(e) => (e.target.background = "var(--bg-1)")}
                  >
                    + Add Row
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Emoji
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        padding: "8px",
                        border: emoji === e ? "2px solid var(--accent)" : "1px solid var(--border)",
                        borderRadius: 6,
                        background: emoji === e ? "var(--accent)12" : "var(--bg-1)",
                        cursor: "pointer",
                        fontSize: 20,
                        transition: "all .2s",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Color
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccent(c)}
                      style={{
                        padding: "12px",
                        border: accent === c ? "2px solid var(--text-1)" : "1px solid var(--border)",
                        borderRadius: 6,
                        background: c,
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : step === "edit" && editingLayout ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Layout Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "var(--font)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "var(--font)",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Layout Structure
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {editRows.map((row, idx) => (
                    <div
                      key={row.id}
                      style={{
                        padding: 10,
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        background: "var(--bg-1)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>Row {idx + 1}</span>
                        {editRows.length > 1 && (
                          <button
                            onClick={() => removeEditRow(row.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-3)",
                              cursor: "pointer",
                              fontSize: 14,
                              padding: "2px 6px",
                              transition: "color .2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.color = "#DC2626")}
                            onMouseLeave={(e) => (e.target.style.color = "var(--text-3)")}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "var(--text-2)" }}>Columns:</label>
                        <select
                          value={row.columns}
                          onChange={(e) => updateEditRowColumns(row.id, parseInt(e.target.value))}
                          style={{
                            padding: "6px 8px",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            fontSize: 12,
                            background: "var(--bg-0)",
                            color: "var(--text-1)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="1">1 Column</option>
                          <option value="2">2 Columns</option>
                          <option value="3">3 Columns</option>
                          <option value="4">4 Columns</option>
                        </select>
                      </div>

                      {/* Visual preview of columns */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {Array.from({ length: row.columns }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              minHeight: 40,
                              background: "var(--bg-0)",
                              border: "1px dashed var(--border)",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              color: "var(--text-3)",
                            }}
                          >
                            Col {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={addEditRow}
                    style={{
                      padding: "10px 12px",
                      border: "1px dashed var(--border)",
                      background: "var(--bg-1)",
                      color: "var(--accent)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all .2s",
                    }}
                    onMouseEnter={(e) => (e.target.background = "var(--accent)12")}
                    onMouseLeave={(e) => (e.target.background = "var(--bg-1)")}
                  >
                    + Add Row
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Emoji
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEditEmoji(e)}
                      style={{
                        padding: "8px",
                        border: editEmoji === e ? "2px solid var(--accent)" : "1px solid var(--border)",
                        borderRadius: 6,
                        background: editEmoji === e ? "var(--accent)12" : "var(--bg-1)",
                        cursor: "pointer",
                        fontSize: 20,
                        transition: "all .2s",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
                  Color
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditAccent(c)}
                      style={{
                        padding: "12px",
                        border: editAccent === c ? "2px solid var(--text-1)" : "1px solid var(--border)",
                        borderRadius: 6,
                        background: c,
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {customLayouts.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-3)", padding: "20px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div>No custom layouts yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Create one to get started</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customLayouts.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        background: "var(--bg-1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      <div style={{ fontSize: 20 }}>{l.emoji}</div>
                      <div
                        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                        onClick={() => handleStartEdit(l)}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{l.name}</div>
                        {l.desc && (
                          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{l.desc}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleStartEdit(l)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent)",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: "4px 8px",
                            transition: "color .2s",
                          }}
                          onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                          onMouseLeave={(e) => (e.target.style.color = "var(--accent)")}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteLayout(l.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-3)",
                            cursor: "pointer",
                            fontSize: 16,
                            padding: "4px 8px",
                            transition: "color .2s",
                          }}
                          onMouseEnter={(e) => (e.target.style.color = "#DC2626")}
                          onMouseLeave={(e) => (e.target.style.color = "var(--text-3)")}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              if (step === "edit") {
                setStep("manage");
                setEditingLayout(null);
              } else {
                onCancel();
              }
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              border: "1px solid var(--border)",
              background: "var(--bg-1)",
              color: "var(--text-1)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "all .2s",
            }}
            onMouseEnter={(e) => (e.target.background = "var(--border)")}
            onMouseLeave={(e) => (e.target.background = "var(--bg-1)")}
          >
            {step === "edit" ? "Back" : "Close"}
          </button>
          {step === "save" && (
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: "8px 16px",
                border: "none",
                background: name.trim() ? "var(--accent)" : "var(--border)",
                color: "white",
                borderRadius: 6,
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 500,
                transition: "all .2s",
                opacity: name.trim() ? 1 : 0.5,
              }}
            >
              Save Layout
            </button>
          )}
          {step === "edit" && (
            <button
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              style={{
                flex: 1,
                padding: "8px 16px",
                border: "none",
                background: editName.trim() ? "var(--accent)" : "var(--border)",
                color: "white",
                borderRadius: 6,
                cursor: editName.trim() ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 500,
                transition: "all .2s",
                opacity: editName.trim() ? 1 : 0.5,
              }}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
