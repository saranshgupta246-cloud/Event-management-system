import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, CheckCircle, CalendarDays, Users, AlertCircle } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function LeaderDashboard() {
  const { refetch } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure we always have the latest role/club assignment from the backend
    refetch();
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;
    async function fetchClub() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/leader/club");
        if (!cancelled) {
          if (res.data?.success) {
            setClub(res.data.data);
          } else {
            setError(res.data?.message || "Unable to load club");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load club");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchClub();
    return () => {
      cancelled = true;
    };
  }, []);

  const memberCount = typeof club?.memberCount === "number" ? club.memberCount : 0;

  const stats = [
    { label: "Club Members", value: `${memberCount}`, detail: "Approved members in your club", icon: Users },
    { label: "Total Registrations", value: "0", detail: "Hook into events later", icon: TrendingUp },
    { label: "Active Events", value: "0", detail: "Based on upcoming events", icon: CalendarDays },
    { label: "Attendance Rate", value: "—", detail: "Coming soon", icon: CheckCircle },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Welcome back, Club Leader
      </h2>
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400 mb-8">Loading your club overview…</p>
      ) : error ? (
        <div className="mb-8 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : club ? (
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You are viewing stats for <span className="font-semibold">{club.name}</span>.
        </p>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Once a club is assigned to your account, its stats will appear here.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {s.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {s.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick links</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/leader/club"
            className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            My Club
          </Link>
          <Link
            to="/leader/events"
            className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            Events
          </Link>
          <Link
            to="/leader/participants"
            className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            Participants
          </Link>
          <Link
            to="/leader/announcements"
            className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            Announcements
          </Link>
        </div>
      </div>
    </div>
  );
}
