import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cblendApi } from "../utils/api";

export default function BlendListPage() {
  const [blends,  setBlends]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await cblendApi.list();
      setBlends(data);
    } catch (e) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm(`Delete document "${id}"?`)) return;
    try {
      await cblendApi.delete(id);
      setBlends((prev) => prev.filter((b) => b.id !== id));
      toast.success("Document deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  function handleCreate() {
    navigate("/");
  }

  return (
    <div className="blends-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Documents</h1>
          <p>All saved CBlend documents</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>+ New document</button>
      </div>

      {loading && <div className="loading" style={{ marginTop: 24 }}>Loading…</div>}

      {!loading && blends.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <span>No documents yet</span>
          <button className="btn btn-primary" onClick={handleCreate}>Create your first document</button>
        </div>
      )}

      <div className="blend-list">
        {blends.map((b) => (
          <div key={b.id} className="blend-card" onClick={() => navigate(`/composer/${b.id}`)}>
            <div className="blend-card-title">{b.title || "Untitled"}</div>
            <div className="blend-card-meta">
              {b.layout && <span className="pill" style={{ marginRight: 5 }}>{b.layout}</span>}
              {b.id}
            </div>
            {b.created && (
              <div className="blend-card-meta" style={{ marginTop: 4 }}>
                {new Date(b.created).toLocaleDateString()}
              </div>
            )}
            <div className="blend-card-actions">
              <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/composer/${b.id}`); }}>
                Open
              </button>
              <button className="btn btn-danger" style={{ fontSize: 11, padding: "3px 8px" }}
                onClick={(e) => handleDelete(b.id, e)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
