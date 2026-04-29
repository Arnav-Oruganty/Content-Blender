import { useState } from "react";
import toast from "react-hot-toast";

export function ImageBlockEditor({ block, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(block?.url || "");
  const [altText, setAltText] = useState(block?.altText || "");
  const [caption, setCaption] = useState(block?.caption || "");
  const [sourceType, setSourceType] = useState(block?.sourceType || "url");

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

  const handleUrlChange = (newUrl) => {
    setPreview(newUrl);
    onUpdate({
      url: newUrl,
      sourceType: "url",
      altText,
      caption,
    });
  };

  const handleAltTextChange = (newAltText) => {
    setAltText(newAltText);
    onUpdate({
      url: preview,
      sourceType,
      altText: newAltText,
      caption,
    });
  };

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
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
          Image Source
        </label>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              name="sourceType"
              value="url"
              checked={sourceType === "url"}
              onChange={(e) => setSourceType(e.target.value)}
            />
            <span>URL</span>
          </label>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              name="sourceType"
              value="local"
              checked={sourceType === "local"}
              onChange={(e) => setSourceType(e.target.value)}
            />
            <span>Upload</span>
          </label>
        </div>

        {sourceType === "url" ? (
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={preview}
            onChange={(e) => handleUrlChange(e.target.value)}
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
        ) : (
          <label
            style={{
              display: "block",
              padding: "16px",
              border: "2px dashed var(--border)",
              borderRadius: 6,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
              transition: "all .2s",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
            {uploading ? "Uploading..." : "Click to upload or drag image"}
          </label>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>
            PREVIEW
          </div>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
            onError={() => {
              toast.error("Failed to load image");
              setPreview("");
            }}
          />
        </div>
      )}

      {/* Alt text */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
          Alt Text
        </label>
        <textarea
          value={altText}
          onChange={(e) => handleAltTextChange(e.target.value)}
          placeholder="Describe the image for accessibility..."
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

      {/* Caption */}
      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "var(--text-2)" }}>
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="Optional image caption..."
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
    </div>
  );
}
