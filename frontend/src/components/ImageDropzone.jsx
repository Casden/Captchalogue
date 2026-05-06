import { useEffect, useRef, useState } from "react";

const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

/** Image is chosen locally; upload runs when the parent starts the mint ceremony. */
export default function ImageDropzone({ onFileSelected, onError, disabled }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const [status, setStatus] = useState("idle");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  function reportError(message) {
    setStatus("error");
    if (onError) onError(message);
  }

  function applyFile(file) {
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
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFilename(file.name);
    setStatus("ready");
    if (onFileSelected) onFileSelected(file);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
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
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    if (onFileSelected) onFileSelected(null);
  }

  const statusLine =
    status === "ready"
      ? "Ready — your image will be pinned when you mint."
      : status === "error"
        ? "Fix the issue above or choose another file."
        : "";

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
            {statusLine && (
              <div
                className={`dropzone-status ${status === "ready" ? "status-uploaded" : status === "error" ? "status-error" : ""}`}
              >
                {statusLine}
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
