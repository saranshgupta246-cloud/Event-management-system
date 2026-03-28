import mongoose from "mongoose";
import Club from "../models/Club.js";

function buildClubLookupOr(param) {
  const p = String(param).trim();
  if (!p) return null;
  const or = [{ slug: p }];
  if (mongoose.Types.ObjectId.isValid(p)) {
    or.push({ _id: new mongoose.Types.ObjectId(p) });
  }
  return { $or: or };
}

/**
 * Resolve a route param that may be a Mongo ObjectId or a club slug (mongoose document).
 */
export async function findClubByIdOrSlug(param) {
  const q = buildClubLookupOr(param);
  if (!q) return null;
  return Club.findOne(q);
}

/** Lean club with coordinator populated (for GET club detail). */
export async function findClubByIdOrSlugLean(param) {
  const q = buildClubLookupOr(param);
  if (!q) return null;
  return Club.findOne(q).populate("coordinator", "name email avatar").lean();
}

/**
 * @param {string} param
 * @returns {Promise<mongoose.Types.ObjectId | null>}
 */
export async function resolveClubObjectId(param) {
  const doc = await findClubByIdOrSlug(param);
  return doc ? doc._id : null;
}
