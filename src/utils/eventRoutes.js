/**
 * Prefer slug for human-readable URLs; fall back to Mongo id when slug is missing.
 */
export function eventRouteSegment(event) {
  if (!event || typeof event !== "object") return "";
  const slug = event.slug != null && String(event.slug).trim();
  if (slug) return slug;
  const id = event._id ?? event.id;
  if (id == null) return "";
  if (typeof id === "object" && id.$oid) return id.$oid;
  return String(id);
}

export function isMongoObjectIdString(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

/** Per-type fee from event (respects isFree). */
export function feeForRegistrationType(event, type) {
  const t = type || "solo";
  if (!event) return 0;
  if (event.isFree?.[t]) return 0;
  return Math.max(0, Number(event.fees?.[t] ?? 0));
}
