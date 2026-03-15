// statusTokens.js - standalone, no tailwind.config import

export const STATUS_META = {
  pending:   { label: "Pending",   bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  reviewing: { label: "Reviewing", bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500"   },
  shortlisted:{ label:"Shortlisted",bg:"bg-purple-100", text:"text-purple-800",  dot:"bg-purple-500"  },
  accepted:  { label: "Accepted",  bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500"  },
  rejected:  { label: "Rejected",  bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500"    },
  withdrawn: { label: "Withdrawn", bg: "bg-gray-100",   text: "text-gray-800",   dot: "bg-gray-500"   },
};

export const CATEGORY_COLORS = {
  technical:   "#2563eb",
  cultural:    "#7c3aed",
  sports:      "#16a34a",
  social:      "#ea580c",
  literary:    "#0891b2",
  research:    "#be185d",
  general:     "#64748b",
};

export const CATEGORY_ACCENT = CATEGORY_COLORS;
