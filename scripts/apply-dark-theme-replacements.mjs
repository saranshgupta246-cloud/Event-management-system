/**
 * One-off: replace legacy dark: slate utilities with standardized hex (see dark mode plan).
 * Skips Navbar.jsx per project rules.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

const SKIP = new Set(["Navbar.jsx"]);

/** Longer / more specific patterns first */
const REPLACEMENTS = [
  // Opacity variants (900)
  [/dark:bg-slate-900\/80\b/g, "dark:bg-[#161f2e]/80"],
  [/dark:bg-slate-900\/70\b/g, "dark:bg-[#161f2e]/70"],
  [/dark:bg-slate-900\/60\b/g, "dark:bg-[#161f2e]/60"],
  [/dark:bg-slate-900\/50\b/g, "dark:bg-[#161f2e]/50"],
  [/dark:bg-slate-900\/40\b/g, "dark:bg-[#161f2e]/40"],
  [/dark:bg-slate-900\/30\b/g, "dark:bg-[#161f2e]/30"],
  [/dark:bg-slate-900\/20\b/g, "dark:bg-[#161f2e]/20"],
  [/dark:bg-slate-900\/10\b/g, "dark:bg-[#161f2e]/10"],
  // Opacity variants (800)
  [/dark:bg-slate-800\/90\b/g, "dark:bg-[#161f2e]/90"],
  [/dark:bg-slate-800\/80\b/g, "dark:bg-[#161f2e]/80"],
  [/dark:bg-slate-800\/60\b/g, "dark:bg-[#161f2e]/60"],
  [/dark:bg-slate-800\/50\b/g, "dark:bg-[#161f2e]/50"],
  [/dark:bg-slate-800\/40\b/g, "dark:bg-[#161f2e]/40"],
  // Opacity variants (950)
  [/dark:bg-slate-950\/80\b/g, "dark:bg-[#0d1117]/80"],
  // Base (after opacity patterns)
  [/dark:bg-slate-950\b/g, "dark:bg-[#0d1117]"],
  [/dark:bg-slate-900\b/g, "dark:bg-[#161f2e]"],
  [/dark:bg-slate-800\b/g, "dark:bg-[#161f2e]"],
  [/dark:bg-slate-700\b/g, "dark:bg-[#1e2d42]"],
  // Borders
  [/dark:border-slate-800\b/g, "dark:border-[#1e2d42]"],
  [/dark:border-slate-700\b/g, "dark:border-[#1e2d42]"],
  [/dark:border-slate-600\b/g, "dark:border-[#2d3f55]"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(jsx|css)$/.test(name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  const base = path.basename(file);
  if (SKIP.has(base)) continue;
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  for (const [re, rep] of REPLACEMENTS) {
    s = s.replace(re, rep);
  }
  if (s !== orig) {
    fs.writeFileSync(file, s, "utf8");
    changed++;
    console.log("updated:", path.relative(path.join(__dirname, ".."), file));
  }
}
console.log("files changed:", changed);
