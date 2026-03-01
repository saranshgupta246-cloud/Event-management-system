import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

export default function useMyRegistrations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/registrations/my");
      if (res.data?.success) {
        setItems(res.data.data || []);
      } else {
        setError(res.data?.message || "Unable to load registrations");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setItems([]);
      } else {
        setError(err.response?.data?.message || "Unable to load registrations");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { items, loading, error, refetch: fetchRegistrations };
}

