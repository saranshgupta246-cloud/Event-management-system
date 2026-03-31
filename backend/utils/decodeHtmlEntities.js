const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#34;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#x2F;": "/",
  "&#47;": "/",
};

function decodeNumericEntity(match, hexOrDec) {
  try {
    const isHex = /^x/i.test(hexOrDec);
    const n = Number.parseInt(isHex ? hexOrDec.slice(1) : hexOrDec, isHex ? 16 : 10);
    if (!Number.isFinite(n)) return match;
    // Keep within valid unicode scalar values
    if (n <= 0 || n > 0x10ffff) return match;
    return String.fromCodePoint(n);
  } catch {
    return match;
  }
}

export function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  if (!str.includes("&")) return str;

  let out = str;
  for (const [k, v] of Object.entries(ENTITY_MAP)) {
    out = out.split(k).join(v);
  }

  // numeric decimal: &#123;  | numeric hex: &#x1F600;
  out = out.replace(/&#(x?[0-9a-fA-F]+);/g, decodeNumericEntity);

  return out;
}

