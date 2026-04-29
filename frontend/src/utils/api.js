import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── CBank ──────────────────────────────────────────────────────────────────
export const cbankApi = {
  list:   ()         => api.get("/cbank").then((r) => r.data.data),
  get:    (id)       => api.get(`/cbank/${id}`).then((r) => r.data.data),
  create: (block)    => api.post("/cbank", block).then((r) => r.data.data),
  update: (id, data) => api.put(`/cbank/${id}`, data).then((r) => r.data.data),
  delete: (id)       => api.delete(`/cbank/${id}`).then((r) => r.data),
  xml:    ()         => api.get("/cbank/xml", { responseType: "text" }).then((r) => r.data),
};

// ── CBlend ─────────────────────────────────────────────────────────────────
export const cblendApi = {
  list:   ()         => api.get("/cblend").then((r) => r.data.data),
  get:    (id)       => api.get(`/cblend/${id}`).then((r) => r.data.data),
  create: (doc)      => api.post("/cblend", doc).then((r) => r.data.data),
  update: (id, doc)  => api.put(`/cblend/${id}`, doc).then((r) => r.data.data),
  delete: (id)       => api.delete(`/cblend/${id}`).then((r) => r.data),
  xml:    (id)       => api.get(`/cblend/${id}/xml`, { responseType: "text" }).then((r) => r.data),
};

// ── Export ─────────────────────────────────────────────────────────────────
export const exportApi = {
  blendXml:  (id) => api.get(`/export/blend/${id}/xml`,  { responseType: "blob" }).then((r) => r.data),
  blendHtml: (id) => api.get(`/export/blend/${id}/html`, { responseType: "blob" }).then((r) => r.data),
  blendPdf:  (id) => api.get(`/export/blend/${id}/pdf`,  { responseType: "blob", timeout: 60000 }).then((r) => r.data),
  cbankXml:  ()   => api.get("/export/cbank/xml",        { responseType: "blob" }).then((r) => r.data),
};
// ── Upload ──────────────────────────────────────────────────────────────
export const uploadApi = {
  image: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data);
  },
};
// ── Health ─────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get("/health").then((r) => r.data),
};

export default api;
