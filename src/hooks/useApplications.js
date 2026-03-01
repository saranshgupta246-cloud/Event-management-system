import { useCallback, useEffect, useState } from "react";
import { getDriveApplications } from "../services/applicationService";

export function useApplications(clubId, driveId, filters = {}) {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!clubId || !driveId) {
      setApplications([]);
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await getDriveApplications(clubId, driveId, filters);
      if (res?.success) {
        setApplications(Array.isArray(res.data) ? res.data : []);
        setPagination(res.pagination || null);
      } else {
        setApplications([]);
        setError(res?.message || "Failed to load applications");
      }
    } catch (err) {
      setApplications([]);
      setError(err?.message || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [clubId, driveId, filters.status, filters.page, filters.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { applications, pagination, isLoading, error, refetch };
}
