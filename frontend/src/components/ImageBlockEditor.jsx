import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function ImageBlockEditor({ block, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(block?.url || "");
  const [altText, setAltText] = useState(block?.altText || "");
  const [caption, setCaption] = useState(block?.caption || "");
  const [sourceType, setSourceType] = useState(block?.sourceType || "url");

  // ✅ FIX: keep preview synced with parent block
  useEffect(() => {
    setPreview(block?.url || "");
  }, [block?.url]);

  // ✅ FILE UPLOAD HANDLER
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      const uploadedUrl = result.data.path || result.data.url;

      setPreview(uploadedUrl);
      setSourceType("local");

      onUpdate({
        url: uploadedUrl,
        sourceType: "local",
        altText,
        caption,
      });

      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ✅ URL CHANGE
  const handleUrlChange = (newUrl) => {
    setPreview(newUrl);

    onUpdate({
      url: newUrl,
      sourceType: "url",
      altText,
      caption,
    });
  };

  // ✅ MODE SWITCH FIX (VERY IMPORTANT)
  const handleSourceChange = (newType) => {
    setSourceType(newType);

    onUpdate({
      url: preview,
      sourceType: newType,
      altText,
      caption,
    });
  };

  // ✅ ALT TEXT
  const handleAltTextChange = (newAltText) => {
    setAltText(newAltText);

    onUpdate({
      url: preview,
      sourceType,
      altText: newAltText,
      caption,
    });
  };

  // ✅ CAPTION
  const handleCaptionChange = (newCaption) => {
    setCaption(newCaption);

    onUpdate({
      url: preview,
      sourceType,
      altText,
      caption: newCaption,
    });
  };

  return (
    <div style={{ padding: "12px", fontSize: 13 }}>
      {/* ─── SOURCE SELECT ─── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Image Source
        </label>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label style={{ flex: 1, cursor: "pointer" }}>
            <input
              type="radio"
              value="url"
              checked={sourceType === "url"}
              onChange={() => handleSourceChange("url")}
            />
            URL
          </label>

          <label style={{ flex: 1, cursor: "pointer" }}>
            <input
              type="radio"
              value="local"
              checked={sourceType === "local"}
              onChange={() => handleSourceChange("local")}
            />
            Upload
          </label>
        </div>

        {/* ─── URL INPUT ─── */}
        {sourceType === "url" ? (
          <input
            type="text"
            placeholder="https://images.unsplash.com/..."
            value={preview}
            onChange={(e) => handleUrlChange(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}
          />
        ) : (
          /* ─── FILE UPLOAD ─── */
          <label
            style={{
              display: "block",
              padding: "16px",
              border: "2px dashed var(--border)",
              borderRadius: 6,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
            {uploading ? "Uploading..." : "Click to upload image"}
          </label>
        )}
      </div>

      {/* ─── PREVIEW ─── */}
      {preview && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, marginBottom: 6 }}>PREVIEW</div>
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 6,
            }}
            onError={() => {
              toast.error("Invalid image URL");
            }}
          />
        </div>
      )}

      {/* ─── ALT TEXT ─── */}
      <textarea
        value={altText}
        onChange={(e) => handleAltTextChange(e.target.value)}
        placeholder="Alt text..."
        style={{
          width: "100%",
          marginBottom: 10,
          padding: 6,
        }}
      />

      {/* ─── CAPTION ─── */}
      <textarea
        value={caption}
        onChange={(e) => handleCaptionChange(e.target.value)}
        placeholder="Caption..."
        style={{
          width: "100%",
          padding: 6,
        }}
      />
    </div>
  );
}