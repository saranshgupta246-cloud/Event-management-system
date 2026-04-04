import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { normalizeEventPayload } from "../utils/eventPayloads";

export default function useAdminEvents({
  search = "",
  status = "",
  page = 1,
  limit = 10,
  sort = "eventDate_desc",
} = {}) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
    stats: { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, pendingApproval: 0, rejected: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/events", {
        params: { search, status, page, limit, sort },
      });
      if (res.data?.success) {
        const payload = res.data.data || {};
        const items = Array.isArray(payload.items) ? payload.items : [];
        const derivedStats = items.reduce(
          (acc, event) => {
            acc.total += 1;
            const statusKey = event?.status;
            if (acc[statusKey] != null) acc[statusKey] += 1;
            const approvalStatus = event?.approvalStatus;
            if (approvalStatus === "pending_approval") acc.pendingApproval += 1;
            if (approvalStatus === "rejected") acc.rejected += 1;
            return acc;
          },
          { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, pendingApproval: 0, rejected: 0 }
        );
        setData({
          ...payload,
          items,
          stats: {
            ...derivedStats,
            ...(payload.stats || {}),
          },
        });
      } else {
        setError(res.data?.message || "Unable to load events");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, limit, sort]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { data, loading, error, refetch: fetchEvents };
}

export async function createAdminEvent(payload) {
  try {
    const res = await api.post("/api/admin/events", normalizeEventPayload(payload));
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to create event" };
  }
}

export async function uploadEventImage(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post("/api/admin/events/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }

    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    const msg = err.response?.data?.message || "Upload failed.";
    return { error: msg };
  }
}

export async function uploadEventQr(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post("/api/admin/events/qr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }

    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    const msg = err.response?.data?.message || "Upload failed.";
    return { error: msg };
  }
}

export async function updateAdminEvent(id, payload) {
  try {
    const res = await api.put(
      `/api/admin/events/${id}`,
      normalizeEventPayload(payload, { partial: true })
    );
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update event" };
  }
}

export async function deleteAdminEvent(id) {
  try {
    const res = await api.delete(`/api/admin/events/${id}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to delete event" };
  }
}

export async function getAdminEvent(id) {
  try {
    const res = await api.get(`/api/admin/events/${id}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to fetch event" };
  }
}

export async function listEventParticipants(eventId, params = {}) {
  try {
    const res = await api.get(`/api/registrations/event/${eventId}/participants`, { params });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to load participants",
    };
  }
}

export async function removeEventParticipant(registrationId, reason) {
  try {
    const res = await api.post(`/api/registrations/${registrationId}/remove`, {
      reason,
    });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to remove participant",
    };
  }
}

export async function bulkRemoveEventParticipants(eventId, registrationIds = []) {
  try {
    const res = await api.post(`/api/registrations/event/${eventId}/bulk-remove`, {
      registrationIds,
    });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Failed to remove selected participants",
    };
  }
}

export async function downloadEventParticipantsCsv(eventId) {
  try {
    const res = await api.get(`/api/registrations/event/${eventId}/export.csv`, {
      responseType: "blob",
    });
    return { success: true, blob: res.data };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to download CSV" };
  }
}
