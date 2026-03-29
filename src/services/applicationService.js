import api from "./api.js";

export async function applyToDrive(driveId, payload) {
  const res = await api.post(`/api/drives/${driveId}/apply`, payload);
  return res.data;
}

export async function getMyApplications() {
  const res = await api.get("/api/applications/my-applications");
  return res.data;
}

export async function getDriveApplications(clubId, driveId, params = {}) {
  const sp = new URLSearchParams(params);
  const res = await api.get(`/api/clubs/${clubId}/drives/${driveId}/applications?${sp.toString()}`);
  return res.data;
}

export async function updateApplicationStatus(applicationId, payload) {
  const res = await api.patch(`/api/applications/${applicationId}/status`, payload);
  return res.data;
}

export async function bulkUpdateStatus(payload) {
  const res = await api.post("/api/applications/bulk-status", payload);
  return res.data;
}

export async function sendEmail(applicationId, payload) {
  const res = await api.post(`/api/applications/${applicationId}/email`, payload);
  return res.data;
}

export async function rateApplication(applicationId, payload) {
  const res = await api.patch(`/api/applications/${applicationId}/rating`, payload);
  return res.data;
}

export async function withdrawApplication(applicationId) {
  return updateApplicationStatus(applicationId, { status: "withdrawn" });
}
