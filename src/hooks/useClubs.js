import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export default function useClubs({ search = "", category = "" } = {}) {
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
  }, [search, category]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return { items, loading, error, refetch: fetchClubs };
}

export async function fetchClubBySlug(slug) {
  try {
    const res = await api.get(`/api/clubs/${slug}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Club not found" };
  }
}

export async function joinClub(id) {
  try {
    const res = await api.post(`/api/clubs/${id}/join`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Join failed" };
  }
}

export async function leaveClub(id) {
  try {
    const res = await api.delete(`/api/clubs/${id}/leave`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Leave failed" };
  }
}
