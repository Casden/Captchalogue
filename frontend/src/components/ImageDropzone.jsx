import { useEffect, useRef, useState } from "react";
import { uploadFile } from "../lib/ipfs";

const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

export default function ImageDropzone({ onUploaded, onError, disabled }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const [status, setStatus] = useState("idle");
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function reportError(message) {
    setStatus("error");
    setProgressText(message);
    if (onError) onError(message);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      reportError("Unsupported file type. Use PNG, JPG, GIF, WEBP, or SVG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reportError("File is too large. Max 10 MB.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFilename(file.name);
    setResult(null);
    setStatus("uploading");
    setProgressText("Uploading and pinning to IPFS...");

    try {
      const uploaded = await uploadFile(file);
      setResult(uploaded);
      setStatus("uploaded");
      setProgressText("Pinned successfully. This CID should remain available after you leave the tab.");
      if (onUploaded) onUploaded(uploaded);
    } catch (err) {
      reportError(err?.message || "IPFS upload failed.");
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setFilename("");
    setResult(null);
    setStatus("idle");
    setProgressText("");
    if (inputRef.current) inputRef.current.value = "";
    if (onUploaded) onUploaded(null);
  }

  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""} ${disabled ? "dropzone-disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {preview ? (
          <img src={preview} alt={filename || "Preview"} className="dropzone-preview" />
        ) : (
          <div className="dropzone-empty">
            <strong>Drop an image here</strong>
            <span>or click to browse</span>
            <small>PNG, JPG, GIF, WEBP, SVG (max 10 MB)</small>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={handleInputChange}
          hidden
          disabled={disabled}
        />
      </div>

      {filename && (
        <div className="dropzone-meta">
          <div>
            <strong>{filename}</strong>
            <div className={`dropzone-status status-${status}`}>{progressText}</div>
            {result && (
              <div className="dropzone-cid">
                <code>{result.uri}</code>
                <a href={result.gatewayUrl} target="_blank" rel="noreferrer" className="link">
                  View via gateway
                </a>
              </div>
            )}
          </div>
          <button type="button" className="btn-ghost" onClick={handleClear} disabled={disabled}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
