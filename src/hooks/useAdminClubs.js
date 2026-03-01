import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

export default function useAdminClubs({ search = "", category = "", status = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const res = await api.get(`/api/clubs?${params.toString()}`);
      if (res.data?.success) {
        setItems(res.data.data || []);
      } else {
        setError(res.data?.message || "Failed to load clubs");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return { items, loading, error, refetch: fetchClubs };
}

export async function createAdminClub(payload) {
  try {
    const res = await api.post("/api/admin/clubs", payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to create club" };
  }
}

export async function updateAdminClub(id, payload) {
  try {
    const res = await api.put(`/api/admin/clubs/${id}`, payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update club" };
  }
}

export async function deleteAdminClub(id) {
  try {
    const res = await api.delete(`/api/admin/clubs/${id}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to delete club" };
  }
}

export async function assignClubLeader(clubId, userId) {
  try {
    const res = await api.put(`/api/admin/clubs/${clubId}/assign-leader`, { userId });
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to assign leader" };
  }
}

export async function checkNameAvailability(name) {
  try {
    const res = await api.get(`/api/clubs/check-name?name=${encodeURIComponent(name || "")}`);
    return res.data?.data?.available ?? false;
  } catch {
    return false;
  }
}

export async function searchAdminUsers(q) {
  try {
    const res = await api.get(`/api/admin/users?q=${encodeURIComponent(q || "")}`);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function updateClubStatus(clubId, status) {
  try {
    const res = await api.patch(`/api/clubs/${clubId}`, { status });
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update status" };
  }
}

export async function updateClubMain(clubId, payload) {
  try {
    const res = await api.patch(`/api/clubs/${clubId}`, payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update club" };
  }
}

export async function createClubWithPresident(payload) {
  try {
    const { name, description, category, logoUrl, bannerUrl, presidentUserId } = payload;
    const createRes = await api.post("/api/clubs", {
      name: name?.trim(),
      description: description || undefined,
      category,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
    });
    if (!createRes.data?.success || !createRes.data?.data?._id) {
      return { success: false, message: createRes.data?.message || "Failed to create club" };
    }
    const clubId = createRes.data.data._id;
    if (presidentUserId) {
      await api.post(`/api/clubs/${clubId}/members`, {
        userId: presidentUserId,
        role: "President",
      });
    }
    return { success: true, data: createRes.data.data, message: "Club created successfully" };
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to create club";
    return { success: false, message: msg };
  }
}
