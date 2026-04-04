import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  ClipboardList,
  Megaphone,
  Target,
  Users,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function NavCard({ icon, title, sub, to, stats }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border p-5 transition-all duration-150 group bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#161f2e] dark:border-[#1e2d42] dark:hover:border-[#2d3f55] dark:hover:bg-[#1a2640]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1e2d42] flex items-center justify-center text-slate-700 dark:text-slate-200">
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors" aria-hidden />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">{title}</p>
      <p className="text-xs text-slate-600 dark:text-slate-500 mb-4 leading-relaxed">{sub}</p>
      <div className="flex gap-5">
        {stats.map((s, i) => (
          <div key={i}>
            <p className="text-xs text-slate-500 dark:text-slate-600 mb-1">{s.label}</p>
            {s.badge ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                {s.badge}
              </span>
            ) : (
              <p className={`text-lg font-medium ${s.color}`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>
    </Link>
  );
}

function RecentActivity() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-4">Recent activity</h3>
      <p className="text-sm text-slate-600 dark:text-slate-500">No recent activity</p>
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { Icon: Calendar, label: "Create new event", to: "/leader/events" },
    { Icon: Target, label: "Start recruitment drive", to: "/leader/recruitment" },
    { Icon: Megaphone, label: "Post announcement", to: "/leader/announcements" },
    { Icon: Users, label: "Invite team member", to: "/leader/club/team" },
  ];
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-600 mb-3">Quick actions</h3>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.to + a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all text-left w-full dark:bg-[#0d1117] dark:border-[#1e2d42] dark:text-slate-400 dark:hover:border-[#2d3f55] dark:hover:text-slate-300"
          >
            <a.Icon className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" aria-hidden />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LeaderDashboard() {
  const { refetch, user } = useAuth();
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

  const navStats = {
    totalMembers: memberCount,
    rolesFilled: 0,
    volunteers: 0,
    activeRecruitmentDrives: 0,
    activeEvents: 0,
    attendanceRate: null,
  };

  return (
    <div className="p-7 min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-1">
          Welcome back, {user?.name?.split(" ")?.[0] ?? "Leader"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-500">
          You are viewing stats for{" "}
          <span className="font-medium text-slate-800 dark:text-slate-400">{club?.name ?? "\u2014"}</span>
          {" \u00b7 "}Club Leader
        </p>
      </div>

      {loading ? (
        <p className="text-slate-600 dark:text-slate-500 mb-8">Loading your club overview...</p>
      ) : error ? (
        <div className="mb-8 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : !club ? (
        <p className="text-slate-600 dark:text-slate-500 mb-8">
          Once a club is assigned to your account, its stats will appear here.
        </p>
      ) : null}

      {club && !loading && !error && (
        <>
          {/* Your Club section */}
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-600 mb-3">Your club</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <NavCard
              icon={<Building2 className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="My Club"
              sub="Manage profile and settings"
              to="/leader/club"
              stats={[
                { label: "Members", value: navStats.totalMembers, color: "text-blue-400" },
                { label: "Status", badge: "Active" },
              ]}
            />
            <NavCard
              icon={<Users className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="Team"
              sub="President, Secretary, Treasurer"
              to="/leader/club/team"
              stats={[
                {
                  label: "Roles filled",
                  value: `${navStats.rolesFilled ?? 0} / 3`,
                  color: "text-violet-400",
                },
                { label: "Volunteers", value: navStats.volunteers ?? 0, color: "text-violet-400" },
              ]}
            />
          </div>

          {/* Manage section */}
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-600 mb-3">Manage</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
            <NavCard
              icon={<Target className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="Recruitment"
              sub="Create drives, review applicants"
              to="/leader/recruitment"
              stats={[
                {
                  label: "Active drives",
                  value: navStats.activeRecruitmentDrives ?? 0,
                  color: "text-purple-400",
                },
              ]}
            />
            <NavCard
              icon={<Calendar className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="Events"
              sub="Upcoming and past club events"
              to="/leader/events"
              stats={[
                {
                  label: "Active events",
                  value: navStats.activeEvents ?? 0,
                  color: "text-orange-400",
                },
              ]}
            />
            <NavCard
              icon={<ClipboardList className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="Attendance"
              sub="Track event attendance"
              to="/leader/attendance"
              stats={[
                {
                  label: "Avg rate",
                  value: navStats.attendanceRate != null ? `${navStats.attendanceRate}%` : "\u2014",
                  color: "text-sky-400",
                },
              ]}
            />
          </div>

          {/* Bottom two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentActivity />
            <QuickActions />
          </div>
        </>
      )}
    </div>
  );
}
