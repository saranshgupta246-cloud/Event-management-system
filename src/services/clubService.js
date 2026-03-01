import api from "./api.js";

export async function getClubs(params = {}) {
  const sp = new URLSearchParams(params);
  const res = await api.get(`/api/clubs?${sp.toString()}`);
  return res.data;
}

export async function getClub(clubId) {
  const res = await api.get(`/api/clubs/${clubId}`);
  return res.data;
}

export async function createClub(payload) {
  const res = await api.post("/api/clubs", payload);
  return res.data;
}

export async function updateClub(clubId, payload) {
  const res = await api.patch(`/api/clubs/${clubId}`, payload);
  return res.data;
}

export async function addMember(clubId, payload) {
  const res = await api.post(`/api/clubs/${clubId}/members`, payload);
  return res.data;
}

export async function getMembers(clubId) {
  const res = await api.get(`/api/clubs/${clubId}/members`);
  return res.data;
}

export async function updateMemberRole(clubId, memberId, payload) {
  const res = await api.patch(`/api/clubs/${clubId}/members/${memberId}/role`, payload);
  return res.data;
}

export async function getRoleHistory(clubId, memberId) {
  const res = await api.get(`/api/clubs/${clubId}/members/${memberId}/role-history`);
  return res.data;
}
