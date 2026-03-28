import Club from "../models/Club.js";
import { generateSlug, ensureUniqueClubSlug } from "./generateSlug.js";

export function clubNeedsSlug(c) {
  return !c?.slug || !String(c.slug).trim();
}

/**
 * If a club document has no slug, generate one from name, persist, return lean object with slug.
 */
export async function ensureSlugForClubLean(c) {
  if (!c?._id || !clubNeedsSlug(c)) return c;
  const base = generateSlug(c.name) || "club";
  const slug = await ensureUniqueClubSlug(Club, base, { _id: { $ne: c._id } });
  await Club.updateOne({ _id: c._id }, { $set: { slug } });
  return { ...c, slug };
}
