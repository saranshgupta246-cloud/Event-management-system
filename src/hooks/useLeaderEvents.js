import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { normalizeEventPayload } from "../utils/eventPayloads";

export default function useLeaderEvents({ search = "", status = "", approvalStatus = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/leader/events", {
        params: {
          ...(search.trim() ? { search } : {}),
          ...(status ? { status } : {}),
          ...(approvalStatus ? { approvalStatus } : {}),
        },
      });
      if (res.data?.success) {
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setError(res.data?.message || "Unable to load club events");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load club events");
    } finally {
      setLoading(false);
    }
  }, [approvalStatus, search, status]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const stats = useMemo(() => {
    return items.reduce(
      (acc, event) => {
        acc.total += 1;
        if (event?.status === "upcoming") acc.upcoming += 1;
        if (event?.status === "ongoing") acc.ongoing += 1;
        if (event?.status === "completed") acc.completed += 1;
        if (event?.approvalStatus === "pending_approval") acc.pendingApproval += 1;
        if (event?.approvalStatus === "rejected") acc.rejected += 1;
        return acc;
      },
      { total: 0, upcoming: 0, ongoing: 0, completed: 0, pendingApproval: 0, rejected: 0 }
    );
  }, [items]);

  return { items, loading, error, refetch: fetchEvents, stats };
}

export async function createLeaderEvent(clubId, payload) {
  if (!clubId) {
    return { success: false, message: "No club is assigned to your account." };
  }
  try {
    const res = await api.post(
      `/api/clubs/${clubId}/events`,
      normalizeEventPayload({
        ...payload,
        approvalStatus: payload.approvalStatus || "pending_approval",
      })
    );
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to create event" };
  }
}

export async function updateLeaderEvent(clubId, id, payload) {
  if (!clubId) {
    return { success: false, message: "No club is assigned to your account." };
  }
  try {
    const res = await api.patch(
      `/api/clubs/${clubId}/events/${id}`,
      normalizeEventPayload(payload, { partial: true })
    );
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update event" };
  }
}

export async function uploadLeaderEventImage(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post("/api/leader/events/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }
    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    return { error: err.response?.data?.message || "Upload failed." };
  }
}

export async function uploadLeaderEventQr(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post("/api/leader/events/qr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }
    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    return { error: err.response?.data?.message || "Upload failed." };
  }
}
