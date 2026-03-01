import api from "./api.js";

export async function getNotifications(params = {}) {
  const sp = new URLSearchParams(params);
  const res = await api.get(`/api/user-notifications?${sp.toString()}`);
  return res.data;
}

export async function markRead(id) {
  const res = await api.patch(`/api/user-notifications/${id}/read`);
  return res.data;
}

export async function markAllRead() {
  const res = await api.patch("/api/user-notifications/read-all");
  return res.data;
}

export async function getUnreadCount() {
  const res = await api.get("/api/user-notifications/unread-count");
  return res.data;
}
