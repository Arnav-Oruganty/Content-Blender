import { useState, useCallback } from "react";
import { cblendApi } from "../utils/api";
import { uid, createRowBlock } from "../utils/blocks";
import toast from "react-hot-toast";

export function useCBlend() {
  const [blendId,    setBlendId]    = useState(null);
  const [blendTitle, setBlendTitle] = useState("Untitled document");
  const [layout,     setLayout]     = useState(null);
  const [blocks,     setBlocks]     = useState([]);
  const [saving,     setSaving]     = useState(false);

  // ── Block mutations ────────────────────────────────────────────────────
  const addBlock = useCallback((blockDef, atIndex) => {
    const newItem = {
      uid:     uid(),
      ref:     blockDef.id || uid(),
      type:    blockDef.type,
      content: blockDef.content ?? blockDef.default ?? "",
      items:   blockDef.items   ?? [],
      width:   blockDef.width   ?? "100%",
      height:  blockDef.height  ?? "auto",
      sourceType: blockDef.sourceType ?? "url",
      url:        blockDef.url ?? "",
      altText:    blockDef.altText ?? "",
      caption:    blockDef.caption ?? "",
      containerType: blockDef.containerType ?? null,
      children: blockDef.children ?? [],
    };
    
    // Preserve row-specific properties
    if (blockDef.type === "row") {
      newItem.columns = blockDef.columns ?? 2;
      newItem.layout = blockDef.layout ?? "horizontal";
      newItem.gap = blockDef.gap ?? "16px";
    }
    
    setBlocks((prev) => {
      const copy = [...prev];
      if (atIndex !== undefined) copy.splice(atIndex, 0, newItem);
      else copy.push(newItem);
      return copy;
    });
  }, []);

  const removeBlock = useCallback((idx) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateBlock = useCallback((idx, patch) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b))
    );
  }, []);

  const reorder = useCallback((fromIdx, toIdx) => {
    setBlocks((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  }, []);

  // ── Row operations ─────────────────────────────────────────────────────
  const addRow = useCallback((columns = 2, atIndex) => {
    const newRow = createRowBlock(columns);
    setBlocks((prev) => {
      const copy = [...prev];
      if (atIndex !== undefined) copy.splice(atIndex, 0, newRow);
      else copy.push(newRow);
      return copy;
    });
  }, []);

  const addToRow = useCallback((rowIndex, blockDef) => {
    setBlocks((prev) => {
      const copy = [...prev];
      if (copy[rowIndex]?.type === "row") {
        const newChild = {
          uid:     uid(),
          ref:     blockDef.id || uid(),
          type:    blockDef.type,
          content: blockDef.content ?? blockDef.default ?? "",
          items:   blockDef.items   ?? [],
          sourceType: blockDef.sourceType ?? "url",
          url:        blockDef.url ?? "",
          altText:    blockDef.altText ?? "",
          caption:    blockDef.caption ?? "",
          containerType: "row",
          children: [],
        };
        copy[rowIndex].children = [...(copy[rowIndex].children || []), newChild];
      }
      return copy;
    });
  }, []);

  const removeFromRow = useCallback((rowIndex, childIndex) => {
    setBlocks((prev) => {
      const copy = [...prev];
      if (copy[rowIndex]?.type === "row" && copy[rowIndex].children) {
        copy[rowIndex].children = copy[rowIndex].children.filter((_, i) => i !== childIndex);
      }
      return copy;
    });
  }, []);

  const reorderInRow = useCallback((rowIndex, fromIdx, toIdx) => {
    setBlocks((prev) => {
      const copy = [...prev];
      if (copy[rowIndex]?.type === "row" && copy[rowIndex].children) {
        const children = [...copy[rowIndex].children];
        const [moved] = children.splice(fromIdx, 1);
        children.splice(toIdx, 0, moved);
        copy[rowIndex].children = children;
      }
      return copy;
    });
  }, []);

  const updateRow = useCallback((rowIndex, patch) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === rowIndex ? { ...b, ...patch } : b))
    );
  }, []);

  const applyLayout = useCallback((layoutDef) => {
    setLayout(layoutDef.id);
    setBlocks(
      layoutDef.blocks.map((b) => {
        const mapped = {
          uid:     uid(),
          ref:     uid(),
          type:    b.type,
          content: b.content ?? "",
          items:   b.items   ?? [],
          width:   b.width   ?? "100%",
          height:  b.height  ?? "auto",
        };
        
        // Preserve row-specific properties
        if (b.type === "row") {
          mapped.columns = b.columns ?? 2;
          mapped.layout = b.layout ?? "horizontal";
          mapped.gap = b.gap ?? "16px";
          mapped.children = (b.children ?? []).map((child) => ({
            uid:     uid(),
            ref:     uid(),
            type:    child.type,
            content: child.content ?? "",
            items:   child.items   ?? [],
            width:   child.width   ?? "100%",
            height:  child.height  ?? "auto",
          }));
        }
        
        return mapped;
      })
    );
    toast.success(`Layout "${layoutDef.name}" applied`);
  }, []);

  const clear = useCallback(() => {
    setBlocks([]);
    setLayout(null);
  }, []);

  // ── Persistence ────────────────────────────────────────────────────────
  const buildDoc = useCallback(
    () => ({
      id:   blendId || `blend-${uid()}`,
      meta: {
        title:   blendTitle,
        layout:  layout || "custom",
        created: new Date().toISOString(),
      },
      blocks,
    }),
    [blendId, blendTitle, layout, blocks]
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const doc = buildDoc();
      let saved;
      if (blendId) {
        saved = await cblendApi.update(blendId, doc);
      } else {
        saved = await cblendApi.create(doc);
        setBlendId(saved.id);
      }
      toast.success("Document saved");
      return saved;
    } catch (e) {
      toast.error("Save failed: " + e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [blendId, buildDoc]);

  const load = useCallback(async (id) => {
    const doc = await cblendApi.get(id);
    setBlendId(doc.id);
    setBlendTitle(doc.meta?.title ?? "Untitled");
    setLayout(doc.meta?.layout ?? null);
    setBlocks(doc.blocks ?? []);
    return doc;
  }, []);

  return {
    blendId, blendTitle, setBlendTitle,
    layout, blocks,
    saving,
    addBlock, removeBlock, updateBlock, reorder,
    addRow, addToRow, removeFromRow, reorderInRow, updateRow,
    applyLayout, clear, save, load, buildDoc,
  };
}

