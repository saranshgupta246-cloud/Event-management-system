import api from "../api/client";

export function isMongoObjectIdString(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export async function fetchClubBySegment(segment) {
  if (!segment) return null;

  try {
    const res = await api.get(`/api/clubs/${segment}`);
    if (res.data?.success && res.data.data) return res.data.data;
  } catch {
    // Fall through to slug lookup.
  }

  if (isMongoObjectIdString(segment)) return null;

  try {
    const res = await api.get(`/api/clubs/by-slug/${segment}`);
    if (res.data?.success && res.data.data) return res.data.data;
  } catch {
    // ignore
  }

  return null;
}
