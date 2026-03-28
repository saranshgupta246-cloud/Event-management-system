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
  return normalizePayloadForMode(payload, { partial: false });
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePayloadForMode(payload, { partial }) {
  const normalized = {};
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  const assignString = (key, transform) => {
    if (!partial || hasOwn(key)) {
      const value = payload[key];
      normalized[key] = transform ? transform(value) : value;
    }
  };

  assignString("title", (v) => (typeof v === "string" ? v.trim() : ""));
  assignString("description", (v) => v || "");
  assignString("clubId", (v) => v || undefined);
  assignString("eventDate");
  assignString("startTime", (v) => v || "");
  assignString("endTime", (v) => v || "");
  assignString("registrationStart", (v) => v || "");
  assignString("registrationEnd", (v) => v || "");
  assignString("location", (v) => v || "");
  assignString("imageUrl", (v) => v || undefined);
  if (!partial || hasOwn("isRecommended")) {
    normalized.isRecommended = !!payload.isRecommended;
  }
  if (!partial || hasOwn("isWorkshop")) {
    normalized.isWorkshop = !!payload.isWorkshop;
  }
  if (!partial || hasOwn("registrationTypes")) {
    normalized.registrationTypes =
      Array.isArray(payload.registrationTypes) && payload.registrationTypes.length > 0
        ? payload.registrationTypes
        : ["solo"];
  }
  if (!partial || hasOwn("fees")) {
    normalized.fees = {
      solo: parseOptionalNumber(payload.fees?.solo) ?? 0,
      duo: parseOptionalNumber(payload.fees?.duo) ?? 0,
      squad: parseOptionalNumber(payload.fees?.squad) ?? 0,
    };
  }
  if (!partial || hasOwn("isFree")) {
    normalized.isFree = {
      solo: payload.isFree?.solo !== false,
      duo: payload.isFree?.duo !== false,
      squad: payload.isFree?.squad !== false,
    };
  }
  if (!partial || hasOwn("teamSize")) {
    normalized.teamSize = {
      min: parseOptionalNumber(payload.teamSize?.min) ?? 2,
      max: parseOptionalNumber(payload.teamSize?.max) ?? 5,
    };
  }
  assignString("upiId", (v) => (v || "").trim());
  assignString("upiQrImageUrl", (v) => v || "");

  const totalSeats = parseOptionalNumber(payload.totalSeats);
  const availableSeats = parseOptionalNumber(payload.availableSeats);
  if (!partial) {
    normalized.totalSeats = totalSeats ?? 0;
    normalized.availableSeats = availableSeats ?? normalized.totalSeats;
  } else {
    if (totalSeats !== undefined) normalized.totalSeats = totalSeats;
    if (availableSeats !== undefined) normalized.availableSeats = availableSeats;
  }

  return normalized;
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
      normalizePayloadForMode(payload, { partial: true })
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

export async function removeEventParticipant(registrationId) {
  try {
    const res = await api.delete(`/api/registrations/${registrationId}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to remove participant" };
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
