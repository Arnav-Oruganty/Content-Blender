import { useState, useCallback, useEffect } from "react";
import { uid } from "../utils/blocks";

const STORAGE_KEY = "cblend_custom_layouts";

export function useCustomLayouts() {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load layouts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLayouts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load layouts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save layouts to localStorage whenever they change
  const saveToStorage = useCallback((newLayouts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
      setLayouts(newLayouts);
    } catch (e) {
      console.error("Failed to save layouts:", e);
    }
  }, []);

  // Create a new layout from current blocks
  const saveAsLayout = useCallback((name, description, blocks, emoji = "📐", accent = "#6B7280") => {
    if (!name?.trim()) return null;

    const newLayout = {
      id: `layout-${uid()}`,
      name: name.trim(),
      desc: description?.trim() || "",
      emoji,
      accent,
      isCustom: true,
      createdAt: new Date().toISOString(),
      blocks: blocks.map((b) => {
        // Remove internal fields from blocks
        const { uid: _, ref: __, containerType: ___, ...cleanBlock } = b;
        return cleanBlock;
      }),
    };

    const updated = [newLayout, ...layouts];
    saveToStorage(updated);
    return newLayout;
  }, [layouts, saveToStorage]);

  // Delete a layout
  const deleteLayout = useCallback((layoutId) => {
    const updated = layouts.filter((l) => l.id !== layoutId);
    saveToStorage(updated);
  }, [layouts, saveToStorage]);

  // Update an existing layout
  const updateLayout = useCallback((layoutId, updates) => {
    const updated = layouts.map((l) => {
      if (l.id === layoutId) {
        // Clean blocks if provided
        const cleanedBlocks = updates.blocks ? updates.blocks.map((b) => {
          const { uid: _, ref: __, containerType: ___, ...cleanBlock } = b;
          return cleanBlock;
        }) : undefined;

        return {
          ...l,
          ...updates,
          blocks: cleanedBlocks || l.blocks,
        };
      }
      return l;
    });
    saveToStorage(updated);
  }, [layouts, saveToStorage]);

  // Get custom layouts only
  const customLayouts = layouts.filter((l) => l.isCustom);

  return {
    layouts,
    customLayouts,
    loading,
    saveAsLayout,
    deleteLayout,
    updateLayout,
  };
}

