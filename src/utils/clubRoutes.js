/**
 * Prefer slug for human-readable URLs; fall back to Mongo id when slug is missing.
 */
export function clubRouteSegment(club) {
  if (!club || typeof club !== "object") return "";
  const slug = club.slug != null && String(club.slug).trim();
  if (slug) return slug;
  const id = club._id ?? club.id;
  if (id == null) return "";
  if (typeof id === "object" && id.$oid) return id.$oid;
  return String(id);
}
