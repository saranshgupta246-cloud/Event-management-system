import Event from "../models/Event.js";
import { generateSlug, ensureUniqueEventSlug } from "./generateSlug.js";

export function eventNeedsSlug(e) {
  return !e?.slug || !String(e.slug).trim();
}

export async function ensureSlugForEventLean(e) {
  if (!e?._id || !eventNeedsSlug(e)) return e;
  const base = generateSlug(e.title) || "event";
  const slug = await ensureUniqueEventSlug(Event, base, { _id: { $ne: e._id } });
  await Event.updateOne({ _id: e._id }, { $set: { slug } });
  return { ...e, slug };
}
