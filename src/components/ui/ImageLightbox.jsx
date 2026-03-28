import React, { useEffect } from "react";

export default function ImageLightbox({ open, imageSrc, title, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} full view` : "Image full view"}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
        aria-label="Close image preview"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className="max-w-[96vw] max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageSrc}
          alt={title || "Full image"}
          className="max-w-full max-h-[92vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
