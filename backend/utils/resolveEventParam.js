import mongoose from "mongoose";
import Event from "../models/Event.js";

function buildEventLookupOr(param) {
  const p = String(param).trim();
  if (!p) return null;
  const or = [{ slug: p }];
  if (mongoose.Types.ObjectId.isValid(p)) {
    or.push({ _id: new mongoose.Types.ObjectId(p) });
  }
  return { $or: or };
}

export async function findEventByIdOrSlug(param) {
  const q = buildEventLookupOr(param);
  if (!q) return null;
  return Event.findOne(q);
}

export async function findEventByIdOrSlugLean(param) {
  const q = buildEventLookupOr(param);
  if (!q) return null;
  return Event.findOne(q).lean();
}

export async function resolveEventObjectId(param) {
  const doc = await findEventByIdOrSlug(param);
  return doc ? doc._id : null;
}
