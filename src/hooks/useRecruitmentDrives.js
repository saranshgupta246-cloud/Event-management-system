import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

export function useRecruitmentDrives(params = {}) {
  const { category, skills, search, status = "open", page = 1, limit = 20 } = params;
  const [data, setData] = useState({ drives: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      if (category) sp.set("category", category);
      if (search && search.trim()) sp.set("search", search.trim());
      if (skills && (Array.isArray(skills) ? skills.length : skills)) {
        (Array.isArray(skills) ? skills : [skills]).forEach((s) => sp.append("skills", s));
      }
      sp.set("page", String(page));
      sp.set("limit", String(limit));
      const res = await api.get(`/api/drives?${sp.toString()}`);
      if (res.data?.success) {
        setData({
          drives: res.data.data || [],
          pagination: res.data.pagination || null,
        });
      } else {
        setData({ drives: [], pagination: null });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load drives");
      setData({ drives: [], pagination: null });
    } finally {
      setLoading(false);
    }
  }, [category, skills, search, status, page, limit]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  return { drives: data.drives, pagination: data.pagination, loading, error, refetch: fetchDrives };
}
