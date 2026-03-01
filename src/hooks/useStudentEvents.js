import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

export default function useStudentEvents({ search = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = search.trim() ? { search } : {};
      const res = await api.get("/api/events", { params });
      if (res.data?.success) {
        setItems(res.data.data || []);
      } else {
        setError(res.data?.message || "Unable to load events");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { items, loading, error, refetch: fetchEvents };
}
