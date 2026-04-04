import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function useMyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    const token = localStorage.getItem("ems_token");
    if (!token) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/applications/my-applications");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setApplications(res.data.data);
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const stats = {
    applied: applications.length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "selected").length,
  };

  return { applications, stats, loading, error, refetch: fetchApplications };
}
