import { getBlockMeta } from "../utils/blocks";

export function RowBlock({ block, idx, onUpdate, onRemove, onSelectChild, onAddToRow, onRemoveFromRow, isDragOver, onDragStart, onDragOver, onDrop, selectedChildIdx, dragSrc, onDropIntoRow }) {
  const isDragOverContainer = dragSrc?.fromBank; // Highlight if dragging from bank
  
  return (
    <div
      className={"blend-item" + (isDragOver ? " drag-over" : "")}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(idx); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }}
      onDrop={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        // Only allow reordering of rows, not dropping items from bank onto row itself
        if (!dragSrc?.fromBank) {
          onDrop(idx); 
        }
      }}
      style={{
        width: "100%",
        minHeight: "auto",
        border: "2px solid var(--accent)",
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        background: "var(--bg-0)",
      }}
    >
      <div className="blend-item-head" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
        <span className="drag-handle" title="Drag to reorder">⠿</span>
        <span style={{ fontWeight: 600, color: "var(--accent)" }}>Row Container</span>
        <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 8 }}>
          {block.columns || 2} columns · {block.children?.length || 0} item{(block.children?.length || 0) !== 1 ? "s" : ""}
        </span>
        <button className="del-btn" style={{ marginLeft: "auto" }} onClick={() => onRemove(idx)}>✕</button>
      </div>

      {/* Row children display - with drop support */}
      <div
        style={{
          display: "flex",
          gap: `${block.gap || "16px"}`,
          marginBottom: 8,
          flexWrap: "wrap",
          padding: 8,
          borderRadius: 6,
          border: isDragOverContainer ? "2px dashed var(--accent)" : "1px dashed transparent",
          background: isDragOverContainer ? "var(--accent)08" : "transparent",
          transition: "all .2s",
          minHeight: block.children?.length === 0 ? 80 : "auto",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDropIntoRow && dragSrc?.fromBank) {
            onDropIntoRow(idx, dragSrc.block);
          }
        }}
      >
        {(block.children || []).map((child, childIdx) => {
          const meta = getBlockMeta(child.type);
          const isSelected = selectedChildIdx === childIdx;
          return (
            <div
              key={child.uid || childIdx}
              onClick={() => onSelectChild(childIdx)}
              style={{
                flex: `1 1 calc(${100 / (block.columns || 2)}% - ${block.gap || "16px"})`,
                minWidth: "120px",
                padding: 8,
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: 6,
                background: isSelected ? "var(--accent)12" : "var(--bg-1)",
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span className={"badge " + meta.colorClass} style={{ fontSize: 10 }}>{child.type}</span>
                <button
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); onRemoveFromRow(idx, childIdx); }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {child.type === "image" ? `[Image: ${child.url || "no URL"}]` : child.content || "[empty]"}
              </div>
            </div>
          );
        })}

        {/* Add button or empty state */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onAddToRow(idx, { type: "paragraph", content: "New item" });
          }}
          style={{
            flex: `1 1 calc(${100 / (block.columns || 2)}% - ${block.gap || "16px"})`,
            minWidth: "120px",
            padding: 8,
            border: "2px dashed var(--border)",
            borderRadius: 6,
            background: "var(--bg-0)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 40,
            fontSize: 12,
            color: "var(--text-3)",
            transition: "all .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.background = "var(--accent)08";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-3)";
            e.currentTarget.style.background = "var(--bg-0)";
          }}
        >
          + Add / Drop here
        </div>
      </div>

      {/* Row settings */}
      <div style={{ padding: "8px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-3)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span>Columns:</span>
          <select
            value={block.columns || 2}
            onChange={(e) => onUpdate(idx, { columns: parseInt(e.target.value) })}
            style={{
              padding: "2px 4px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 11,
              background: "var(--bg-1)",
              color: "var(--text-1)",
              outline: "none",
            }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Gap:</span>
          <select
            value={block.gap || "16px"}
            onChange={(e) => onUpdate(idx, { gap: e.target.value })}
            style={{
              padding: "2px 4px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 11,
              background: "var(--bg-1)",
              color: "var(--text-1)",
              outline: "none",
            }}
          >
            <option value="8px">Small (8px)</option>
            <option value="16px">Medium (16px)</option>
            <option value="24px">Large (24px)</option>
            <option value="32px">XLarge (32px)</option>
          </select>
        </label>
      </div>
    </div>
  );
}
