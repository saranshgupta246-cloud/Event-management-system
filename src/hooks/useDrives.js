import { useCallback, useEffect, useState } from "react";
import { getDrives } from "../services/driveService";

export function useDrives(filters = {}) {
  const [drives, setDrives] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await getDrives(filters);
      if (res?.success) {
        setDrives(Array.isArray(res.data) ? res.data : []);
        setPagination(res.pagination || null);
      } else {
        setDrives([]);
        setError(res?.message || "Failed to load drives");
      }
    } catch (err) {
      setDrives([]);
      setError(err?.message || "Failed to load drives");
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.category, filters.search, filters.page, filters.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { drives, pagination, isLoading, error, refetch };
}
