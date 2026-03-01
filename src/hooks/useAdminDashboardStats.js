import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

const EMPTY_STATS = {
  totalStudents: 0,
  activeEvents: 0,
  certificatesIssued: 0,
  clubRecruitment: 0,
};

const EMPTY_CHART = {
  daily: [],
  monthly: [],
};

const EMPTY_ACTIVITIES = [];

export default function useAdminDashboardStats() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [chart, setChart] = useState(EMPTY_CHART);
  const [activities, setActivities] = useState(EMPTY_ACTIVITIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/dashboard/overview");

      if (res.data?.success) {
        const payload = res.data.data || {};
        setStats({
          totalStudents: Number(payload.stats?.totalStudents) || 0,
          activeEvents: Number(payload.stats?.activeEvents) || 0,
          certificatesIssued: Number(payload.stats?.certificatesIssued) || 0,
          clubRecruitment: Number(payload.stats?.clubRecruitment) || 0,
        });
        setChart({
          daily: Array.isArray(payload.chart?.daily) ? payload.chart.daily : [],
          monthly: Array.isArray(payload.chart?.monthly)
            ? payload.chart.monthly
            : [],
        });
        setActivities(
          Array.isArray(payload.activities) ? payload.activities : []
        );
      } else {
        setStats(EMPTY_STATS);
        setChart(EMPTY_CHART);
        setActivities(EMPTY_ACTIVITIES);
        setError(res.data?.message || "Unable to load admin dashboard stats");
      }
    } catch (err) {
      setStats(EMPTY_STATS);
      setChart(EMPTY_CHART);
      setActivities(EMPTY_ACTIVITIES);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load admin dashboard stats";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    stats,
    chart,
    activities,
    loading,
    error,
    refetch: fetchOverview,
  };
}

