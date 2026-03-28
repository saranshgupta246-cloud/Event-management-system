/**
 * Slugify a club name: lowercase, non [a-z0-9] -> '-', trim leading/trailing '-'
 * @param {string} name
 * @returns {string}
 */
export function generateSlug(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Base slug + numeric suffix for uniqueness (e.g. foo, foo-2, foo-3).
 * @param {string} baseSlug
 * @param {import("mongoose").FilterQuery} excludeQuery — e.g. { _id: { $ne: id } }
 */
export async function ensureUniqueClubSlug(ClubModel, baseSlug, excludeQuery = {}) {
  let slug = baseSlug || "club";
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await ClubModel.findOne({ slug, ...excludeQuery }).select("_id").lean();
    if (!exists) return slug;
    n += 1;
    slug = `${baseSlug}-${n + 1}`;
  }
}

/**
 * Unique slug for events (same suffix rules as clubs).
 */
export async function ensureUniqueEventSlug(EventModel, baseSlug, excludeQuery = {}) {
  let slug = baseSlug || "event";
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await EventModel.findOne({ slug, ...excludeQuery }).select("_id").lean();
    if (!exists) return slug;
    n += 1;
    slug = `${baseSlug}-${n + 1}`;
  }
}
