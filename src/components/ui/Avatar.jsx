import React from "react";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({ name, imageUrl, size = "md" }) {
  const sizeClass = SIZES[size] || SIZES.md;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Avatar"}
        className={`rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600 ${sizeClass}`}
      title={name}
    >
      {initials}
    </div>
  );
}
