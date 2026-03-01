/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        surface: {
          0: "#FFFFFF",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        border: {
          light: "#E2E8F0",
          default: "#CBD5E1",
        },
        status: {
          pending: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
          shortlisted: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
          interview: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
          selected: { bg: "#F0FDF4", text: "#14532D", dot: "#22C55E" },
          rejected: { bg: "#FFF1F2", text: "#881337", dot: "#F43F5E" },
          withdrawn: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
        },
        role: {
          President: "#2563EB",
          Secretary: "#16A34A",
          Treasurer: "#7C3AED",
          "Core Member": "#0891B2",
          Volunteer: "#D97706",
          Member: "#6B7280",
        },
        category: {
          Technical: "#2563EB",
          Cultural: "#7C3AED",
          Sports: "#16A34A",
          Marketing: "#EA580C",
        },
        secondary: "#b91c1c",
        navy: "#0B1E3D",
        coral: "#FF6B6B",
        gold: "#C6A75E",
        "background-light": "#f8fafc",
        "background-dark": "#0f172a",
        "academic-blue": "#1E3B8A",
        "slate-grey": "#334155",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        heading: ["Poppins", "Sora", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      maxWidth: {
        1440: "1440px",
      },
    },
  },
  plugins: [],
};

