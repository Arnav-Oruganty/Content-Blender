import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cbankApi } from "../utils/api";
import toast from "react-hot-toast";

const CbankContext = createContext(null);

export function CbankProvider({ children }) {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cbankApi.list();
      setBlocks(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (block) => {
    const saved = await cbankApi.create(block);
    // Immediately push into shared state so Composer sees it instantly
    setBlocks((prev) => [...prev, saved]);
    toast.success(`"${saved.name || saved.id}" added to CBank`);
    return saved;
  }, []);

  const update = useCallback(async (id, data) => {
    const saved = await cbankApi.update(id, data);
    setBlocks((prev) => prev.map((b) => (b.id === id ? saved : b)));
    toast.success("Block updated");
    return saved;
  }, []);

  const remove = useCallback(async (id) => {
    await cbankApi.delete(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    toast.success(`Block removed`);
  }, []);

  return (
    <CbankContext.Provider value={{ blocks, loading, error, reload: load, create, update, remove }}>
      {children}
    </CbankContext.Provider>
  );
}

export function useCBank() {
  const ctx = useContext(CbankContext);
  if (!ctx) throw new Error("useCBank must be used inside <CbankProvider>");
  return ctx;
}
