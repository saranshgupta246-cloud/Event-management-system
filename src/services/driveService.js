import api from "./api.js";

export async function getDrives(params = {}) {
  const sp = new URLSearchParams(params);
  const res = await api.get(`/api/drives?${sp.toString()}`);
  return res.data;
}

export async function getDrive(clubId, driveId) {
  const res = await api.get(`/api/clubs/${clubId}/drives/${driveId}`);
  return res.data;
}

export async function getDrivesByClub(clubId, params = {}) {
  const sp = new URLSearchParams(params);
  const res = await api.get(`/api/clubs/${clubId}/drives?${sp.toString()}`);
  return res.data;
}

export async function createDrive(clubId, payload) {
  const res = await api.post(`/api/clubs/${clubId}/drives`, payload);
  return res.data;
}

export async function updateDrive(clubId, driveId, payload) {
  const res = await api.patch(`/api/clubs/${clubId}/drives/${driveId}`, payload);
  return res.data;
}

export async function getAllDrives(params = {}) {
  return getDrives(params);
}
