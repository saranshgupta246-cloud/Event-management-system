import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

function walk(d, acc = []) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(jsx|js)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function fix(s) {
  let t = s;
  t = t.replace(/\u00e2\u20ac\u201d/g, "\u2014");
  t = t.replace(/\u00e2\u20ac\u00a6/g, "...");
  t = t.replace(/\u00e2\u20ac\u00a2/g, "\u2022");
  t = t.replace(/\u00c2\u00b7/g, "\u00b7");
  t = t.replace(/\u00e2\u2020\u2019/g, "\u2192");
  t = t.replace(/\u00e2\u2020\u0090/g, "\u2190");
  t = t.replace(/\u00e2\u2020\u2018/g, "\u2191");
  t = t.replace(/\u00e2\u2020\u201c/g, "\u2193");
  // UTF-8 en dash E2 80 93 misread as three chars (common):
  t = t.replace(/\u00e2\u20ac\u201c/g, "\u2013");
  return t;
}

let n = 0;
for (const f of walk(root)) {
  const orig = fs.readFileSync(f, "utf8");
  const next = fix(orig);
  if (next !== orig) {
    fs.writeFileSync(f, next, "utf8");
    n++;
    console.log(path.relative(path.join(__dirname, ".."), f));
  }
}
console.log("files updated:", n);
