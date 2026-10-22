"use client";

import { useState, useRef } from "react";

export function ImageUpload() {
  const [url, setUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setUrl(data.url);
    } catch (err: any) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="form-field form-full">
      <label>Product Image</label>
      
      {/* Hidden input that actually submits the URL to the server action */}
      <input type="hidden" name="imageUrl" value={url} />

      {url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <div style={{ width: 64, height: 80, background: "var(--color-line)", border: "0.5px solid var(--color-line)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <button 
            type="button" 
            onClick={() => { setUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className="delete-btn"
          >
            Remove image
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
            id="image-upload"
          />
          <label 
            htmlFor="image-upload"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              border: "0.5px solid var(--color-line)",
              background: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: isUploading ? "wait" : "pointer",
              color: "var(--color-ink)",
            }}
          >
            {isUploading ? "Uploading..." : "Choose file"}
          </label>
          {error && <p style={{ color: "#a03a2a", fontSize: 11, marginTop: 8 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
