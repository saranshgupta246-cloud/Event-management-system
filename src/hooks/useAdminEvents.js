import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

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
    stats: { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 },
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
        setData(res.data.data);
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

function normalizePayload(payload) {
  const totalSeats = Number(payload.totalSeats || 0);
  const availableSeats =
    payload.availableSeats === undefined || payload.availableSeats === ""
      ? totalSeats
      : Number(payload.availableSeats);

  return {
    title: payload.title?.trim() || "",
    description: payload.description || "",
    clubId: payload.clubId || undefined,
    eventDate: payload.eventDate,
    startTime: payload.startTime || "",
    endTime: payload.endTime || "",
    registrationStart: payload.registrationStart || "",
    registrationEnd: payload.registrationEnd || "",
    location: payload.location || "",
    totalSeats,
    availableSeats,
    status: payload.status || "upcoming",
    imageUrl: payload.imageUrl || undefined,
  };
}

export async function createAdminEvent(payload) {
  try {
    const res = await api.post("/api/admin/events", normalizePayload(payload));
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

export async function updateAdminEvent(id, payload) {
  try {
    const res = await api.put(`/api/admin/events/${id}`, normalizePayload(payload));
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
