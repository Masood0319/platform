"use client";

import { cn } from "@/lib/utils";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

/**
 * `value` can be either:
 *  - a File object (freshly picked, not yet uploaded) — previewed via a
 *    local blob URL that is revoked on change/unmount, or
 *  - a string (an already-uploaded remote URL, e.g. from Cloudinary) —
 *    previewed directly.
 *
 * `uploading` shows a spinner state while a real upload request is in
 * flight (the parent is responsible for calling the upload service and
 * flipping this prop).
 */
export function FileUpload({
  label,
  accept,
  value,
  onChange,
  previewType = "image",
  uploading = false,
  maxSizeMb = 5,
  className,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const isRemoteUrl = typeof value === "string";
  const isLocalFile = value instanceof File;

  const objectUrl = useMemo(
    () => (isLocalFile ? URL.createObjectURL(value) : null),
    [value, isLocalFile]
  );

  // Revoke the blob URL whenever it changes or the component unmounts,
  // to avoid leaking memory across repeated selections.
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = isRemoteUrl ? value : objectUrl;

  const validateAndEmit = (file) => {
    if (!file) return;
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      onChange(null, { error: `File exceeds the ${maxSizeMb}MB limit` });
      return;
    }
    onChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndEmit(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => validateAndEmit(e.target.files?.[0]);
  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium text-[var(--text-main)]">{label}</label>}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed border-white/30 bg-white/20 p-6 text-center transition-all duration-200",
          "hover:border-[var(--primary)] hover:bg-white/30",
          isDragging && "border-[var(--primary)] bg-[var(--primary)]/5",
          value && "border-solid border-[var(--primary)]/50",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="animate-spin text-[var(--primary)]" size={22} />
            Uploading...
          </div>
        ) : previewUrl && previewType === "image" ? (
          <div className="relative mx-auto inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-32 rounded-xl object-contain shadow-md"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : value ? (
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
              {(isLocalFile ? value.type?.includes("pdf") : String(value).includes(".pdf")) ? (
                <FileText className="text-[var(--primary)]" size={24} />
              ) : (
                <ImageIcon className="text-[var(--primary)]" size={24} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="truncate text-sm font-medium text-[var(--text-main)]">
                {isLocalFile ? value.name : "Uploaded file"}
              </p>
              {isLocalFile && (
                <p className="text-xs text-[var(--text-muted)]">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
              <Upload className="text-[var(--primary)]" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-main)]">
                Drop {accept?.replace(/\*/g, "")} or click to upload
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Max {maxSizeMb}MB. Supports{" "}
                {accept
                  ?.split(",")
                  .map((t) => t.replace(".", "").toUpperCase())
                  .join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}