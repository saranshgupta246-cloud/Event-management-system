import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  Users,
  Building2,
  Target,
  Zap,
  Laptop,
  Palette,
  Trophy,
  Megaphone,
  Briefcase,
} from "lucide-react";
import useAdminClubs, {
  createClubWithPresident,
  updateClubStatus,
  updateAdminClub,
  updateClubMain,
  assignClubLeader,
  checkNameAvailability,
  searchAdminUsers,
} from "../../hooks/useAdminClubs";

const CATEGORIES = [
  { value: "Technical", label: "Technical", icon: Laptop, color: "#2563EB", desc: "Tech & coding" },
  { value: "Cultural", label: "Cultural", icon: Palette, color: "#7C3AED", desc: "Arts & culture" },
  { value: "Sports", label: "Sports", icon: Trophy, color: "#16A34A", desc: "Sports & fitness" },
  { value: "Marketing", label: "Marketing", icon: Megaphone, color: "#EA580C", desc: "Outreach & events" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  return name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function relativeDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 1) return "Today";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function AdminClubsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);
  const [editClub, setEditClub] = useState(null);
  const [assignLeaderClub, setAssignLeaderClub] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");

  const { items: clubs, loading, error, refetch } = useAdminClubs({
    search,
    category: category || "",
    status: statusFilter === "all" ? "" : statusFilter,
  });

  const stats = useMemo(() => {
    const totalClubs = clubs.length;
    const activeClubs = clubs.filter((c) => c.status === "active" || !c.status).length;
    const totalMembers = clubs.reduce((s, c) => s + (c.memberCount || 0), 0);
    const openDrives = clubs.reduce((s, c) => s + (c.openDrivesCount || 0), 0);
    return { totalClubs, activeClubs, totalMembers, openDrives };
  }, [clubs]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusToggle = useCallback(
    async (club) => {
      const nextStatus = club.status === "active" || !club.status ? "inactive" : "active";
      if (nextStatus === "inactive") {
        setDeactivateConfirm(club);
        return;
      }
      try {
        const res = await updateClubStatus(club._id, "active");
        if (res?.success) {
          refetch();
          showToast("Club reactivated.");
        } else {
          showToast(res?.message || "Failed", true);
        }
      } catch {
        showToast("Failed to update", true);
      }
    },
    [refetch]
  );

  const handleConfirmDeactivate = useCallback(
    async () => {
      if (!deactivateConfirm) return;
      const club = deactivateConfirm;
      setDeactivateConfirm(null);
      try {
        const res = await updateClubStatus(club._id, "inactive");
        if (res?.success) {
          refetch();
          showToast("Club deactivated.");
        } else {
          showToast(res?.message || "Failed", true);
        }
      } catch {
        showToast("Failed to deactivate", true);
      }
    },
    [deactivateConfirm, refetch]
  );

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="px-4 py-6 md:px-6 md:py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto w-full">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ letterSpacing: "-0.02em" }}>
              Clubs
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400" style={{ lineHeight: 1.6 }}>
              Create clubs, assign leaders, and manage club activity
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Club
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "clubs registered", value: stats.totalClubs, icon: Building2, bg: "bg-blue-100", iconColor: "text-blue-600", trend: "+3 this month", trendUp: true },
            { label: "Active Clubs", value: stats.activeClubs, icon: Zap, bg: "bg-green-100", iconColor: "text-green-600", trend: null },
            { label: "Total Members", value: stats.totalMembers, icon: Users, bg: "bg-purple-100", iconColor: "text-purple-600", trend: null },
            { label: "accepting applications", value: stats.openDrives, icon: Target, bg: "bg-amber-100", iconColor: "text-amber-600", trend: "open drives", sub: true },
          ].map((stat) => (
            <div
              key={stat.label}
              className="admin-card rounded-2xl p-5 shadow-sm transition-all hover:shadow-md dark:bg-white/[0.05] dark:border dark:border-white/[0.08]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.iconColor} dark:bg-white/10 dark:text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              {stat.trend && <p className={`mt-1 text-xs ${stat.trendUp ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>{stat.sub ? `${stat.value} ${stat.trend}` : stat.trend}</p>}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table / Cards */}
        <div className="admin-card rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-6 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : clubs.length === 0 ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Club</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Members</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Active Drives</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Created</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clubs.map((club) => (
                      <ClubTableRow
                        key={club._id}
                        club={club}
                        onStatusToggle={() => handleStatusToggle(club)}
                        onEdit={() => setEditClub(club)}
                        onAssignLeader={() => { setAssignLeaderClub(club); setAssignUserId(""); }}
                        onDeactivate={() => setDeactivateConfirm(club)}
                        onRefetch={refetch}
                        showToast={showToast}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-slate-100">
                {clubs.map((club) => (
                  <ClubCard
                    key={club._id}
                    club={club}
                    onStatusToggle={() => handleStatusToggle(club)}
                    onEdit={() => setEditClub(club)}
                    onAssignLeader={() => { setAssignLeaderClub(club); setAssignUserId(""); }}
                    onDeactivate={() => setDeactivateConfirm(club)}
                    onRefetch={refetch}
                    showToast={showToast}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateClubModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); refetch(); showToast("Club created."); }}
          onError={(msg) => showToast(msg, true)}
        />
      )}

      {deactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Deactivate {deactivateConfirm.name}?</h3>
            <p className="mt-2 text-sm text-slate-600">This will mark the club as inactive. Members and drives will remain.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeactivateConfirm(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleConfirmDeactivate} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {editClub && (
        <EditClubModal
          club={editClub}
          onClose={() => setEditClub(null)}
          onSuccess={() => { setEditClub(null); refetch(); showToast("Club updated."); }}
          onError={(msg) => showToast(msg, true)}
        />
      )}

      {assignLeaderClub && (
        <AssignLeaderModal
          club={assignLeaderClub}
          userId={assignUserId}
          onUserIdChange={setAssignUserId}
          onClose={() => { setAssignLeaderClub(null); setAssignUserId(""); }}
          onSuccess={() => { setAssignLeaderClub(null); setAssignUserId(""); refetch(); showToast("Leader assigned."); }}
          onError={(msg) => showToast(msg, true)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-fadeIn" style={{ backgroundColor: toast.isError ? "#FEE2E2" : "#F0FDF4", color: toast.isError ? "#991B1B" : "#14532D" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-white/10 dark:text-slate-400">
        <Building2 className="h-12 w-12" />
      </div>
      <p className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-400">No clubs yet</p>
      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Create your first club to get started</p>
      <button type="button" onClick={onCreate} className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-md dark:bg-blue-600 dark:hover:bg-blue-700">
        <Plus className="h-5 w-5" />
        Create Club
      </button>
    </div>
  );
}

function ClubTableRow({ club, onStatusToggle, onEdit, onAssignLeader, onDeactivate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = club.status === "active" || !club.status;
  const cat = CATEGORY_MAP[club.category];
  const openDrives = club.openDrivesCount ?? 0;

  return (
    <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {club.logoUrl ? (
            <img src={club.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover border border-slate-200" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: cat?.color || "#6B7280" }}>
              {club.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div>
            <Link to={`/admin/clubs/${club._id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
              {club.name}
            </Link>
            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: cat?.color || "#6B7280" }}>{club.category || "—"}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{club.memberCount ?? 0}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">members</p>
      </td>
      <td className="px-4 py-3">
        {openDrives === 0 ? <span className="text-sm text-slate-400 dark:text-slate-500">—</span> : <><span className="text-sm font-medium text-blue-600 dark:text-blue-400">{openDrives}</span><span className="text-xs text-slate-500 dark:text-slate-400"> open drives</span></>}
      </td>
      <td className="px-4 py-3">
        <button type="button" role="switch" aria-checked={isActive} onClick={onStatusToggle} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? "bg-green-500" : "bg-slate-300"}`}>
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{relativeDate(club.createdAt)}</p>
        {club.createdBy && (
          <div className="flex items-center gap-2 mt-0.5">
            {club.createdBy.avatar ? <img src={club.createdBy.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-400">{getInitials(club.createdBy.name)}</span>}
            <span className="text-xs text-slate-600 dark:text-slate-400">{club.createdBy.name}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="relative flex items-center gap-1">
          <Link to={`/admin/clubs/${club._id}`} className="rounded-lg px-2 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10">View</Link>
          <Link to={`/leader/clubs/${club._id}/recruitment`} className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center gap-1" title="Recruitment"><Briefcase className="h-4 w-4" /> Recruitment</Link>
          <button type="button" onClick={onEdit} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" title="Edit"><Pencil className="h-4 w-4" /></button>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><MoreVertical className="h-4 w-4" /></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <Link to={`/admin/clubs/${club._id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>View club</Link>
                  <Link to={`/leader/clubs/${club._id}/recruitment`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Recruitment</Link>
                  <Link to={`/leader/clubs/${club._id}/team`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>View Members</Link>
                  <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                  {isActive && <button type="button" onClick={() => { setMenuOpen(false); onDeactivate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Deactivate</button>}
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function ClubCard({ club, onStatusToggle, onEdit, onDeactivate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = club.status === "active" || !club.status;
  const cat = CATEGORY_MAP[club.category];
  const openDrives = club.openDrivesCount ?? 0;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0" /> : <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: cat?.color || "#6B7280" }}>{club.name?.charAt(0)?.toUpperCase()}</div>}
          <div className="min-w-0">
            <Link to={`/admin/clubs/${club._id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate block">{club.name}</Link>
            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white mt-1" style={{ backgroundColor: cat?.color || "#6B7280" }}>{club.category || "—"}</span>
          </div>
        </div>
        <div className="relative shrink-0">
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><MoreVertical className="h-4 w-4" /></button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <Link to={`/admin/clubs/${club._id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>View club</Link>
                <Link to={`/leader/clubs/${club._id}/recruitment`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Recruitment</Link>
                <Link to={`/leader/clubs/${club._id}/team`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>View Members</Link>
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                {isActive && <button type="button" onClick={() => { setMenuOpen(false); onDeactivate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Deactivate</button>}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium text-slate-900 dark:text-white">{club.memberCount ?? 0} members</span>
        {openDrives > 0 ? <span className="text-blue-600 dark:text-blue-400">{openDrives} open drives</span> : <span className="text-slate-400 dark:text-slate-500">—</span>}
        <button type="button" role="switch" aria-checked={isActive} onClick={onStatusToggle} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isActive ? "bg-green-500" : "bg-slate-300"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{relativeDate(club.createdAt)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to={`/admin/clubs/${club._id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View</Link>
        <Link to={`/leader/clubs/${club._id}/recruitment`} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline">Recruitment</Link>
        <Link to={`/leader/clubs/${club._id}/team`} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:underline">Team</Link>
        <button type="button" onClick={onEdit} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">Edit</button>
      </div>
    </div>
  );
}

function CreateClubModal({ onClose, onSuccess, onError }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [president, setPresident] = useState(null);
  const [presidentQuery, setPresidentQuery] = useState("");
  const [presidentResults, setPresidentResults] = useState([]);
  const [presidentSearching, setPresidentSearching] = useState(false);
  const [nameChecking, setNameChecking] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedName = useDebounce(name, 400);
  const debouncedPresidentQuery = useDebounce(presidentQuery, 350);

  useEffect(() => {
    if (!debouncedName.trim()) { setNameAvailable(null); return; }
    let cancelled = false;
    setNameChecking(true);
    checkNameAvailability(debouncedName).then((available) => { if (!cancelled) setNameAvailable(available); }).finally(() => { if (!cancelled) setNameChecking(false); });
    return () => { cancelled = true; };
  }, [debouncedName]);

  useEffect(() => {
    if (!debouncedPresidentQuery || debouncedPresidentQuery.length < 2) { setPresidentResults([]); return; }
    let cancelled = false;
    setPresidentSearching(true);
    searchAdminUsers(debouncedPresidentQuery).then((list) => { if (!cancelled) setPresidentResults(list); }).finally(() => { if (!cancelled) setPresidentSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedPresidentQuery]);

  const validUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

  const handleSubmit = async () => {
    if (!name.trim() || !category) { onError("Name and category are required."); return; }
    if (nameAvailable === false) { onError("Club name is already taken."); return; }
    setSubmitting(true);
    try {
      const res = await createClubWithPresident({ name: name.trim(), description: description.trim() || undefined, category, logoUrl: logoUrl.trim() || undefined, bannerUrl: undefined, presidentUserId: president?._id });
      if (res?.success) onSuccess();
      else onError(res?.message || "Create failed.");
    } catch { onError("Create failed."); }
    finally { setSubmitting(false); }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const content = (
    <>
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-6 py-5 rounded-t-2xl">
        <h2 className="text-lg font-semibold text-white">Create Club</h2>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Club Name *</label>
          <div className="relative">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Code Chef MITS" className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {nameChecking && <span className="text-slate-400 text-xs">Checking...</span>}
              {!nameChecking && debouncedName.trim() && nameAvailable === true && <Check className="h-5 w-5 text-green-600" />}
              {!nameChecking && debouncedName.trim() && nameAvailable === false && <X className="h-5 w-5 text-red-500" />}
            </div>
          </div>
          {!nameChecking && debouncedName.trim() && nameAvailable === false && <p className="mt-1 text-xs text-red-600">Name already taken</p>}
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={3} placeholder="Short description..." className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none" />
          <p className="mt-1 text-xs text-slate-400">{description.length}/300</p>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const selected = category === c.value;
              return (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${selected ? "border-current" : "border-slate-200 hover:border-slate-300"}`} style={selected ? { borderColor: c.color, backgroundColor: `${c.color}14` } : {}}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: c.color }}><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.label}</p>
                    <p className="text-xs text-slate-500">{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Logo URL</label>
          <div className="flex items-center gap-3">
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="flex-1 rounded-lg border border-slate-200 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
            {logoUrl.trim() && validUrl(logoUrl.trim()) && <img src={logoUrl.trim()} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = "none"; }} />}
            {logoUrl.trim() && !validUrl(logoUrl.trim()) && <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">Invalid URL</div>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Assign Club President *</label>
          <div className="relative">
            <input type="text" value={presidentQuery} onChange={(e) => setPresidentQuery(e.target.value)} placeholder="Search by name, email, or ID" className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
            {president && <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1.5 text-sm">{president.name} <button type="button" onClick={() => { setPresident(null); setPresidentQuery(""); }} className="hover:bg-blue-200 rounded-full p-0.5"><X className="h-4 w-4" /></button></div>}
            {!president && presidentQuery.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto z-10">
                {presidentSearching ? <p className="p-3 text-sm text-slate-500">Searching...</p> : presidentResults.length === 0 ? <p className="p-3 text-sm text-slate-500">No users found.</p> : presidentResults.map((u) => (
                  <button key={u._id} type="button" onClick={() => { setPresident(u); setPresidentQuery(""); setPresidentResults([]); }} className="flex w-full items-center gap-3 p-3 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0">
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">{u.avatar ? <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : getInitials(u.name)}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{u.name}</p><p className="text-xs text-slate-500 truncate">{u.email}</p></div>
                    <span className="text-xs font-mono text-slate-500">{u.enrollmentId || u.studentId || "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!name.trim() || !category || !president || nameAvailable === false || submitting} className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-[0_1px_2px_rgba(37,99,235,0.3)]">{submitting ? "Creating..." : "Create Club"}</button>
        </div>
      </div>
    </>
  );

  if (isMobile) return <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30"><div className="bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>{content}</div><div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden /></div>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"><div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>{content}</div><div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden /></div>;
}

function EditClubModal({ club, onClose, onSuccess, onError }) {
  const [name, setName] = useState(club.name || "");
  const [description, setDescription] = useState(club.description || "");
  const [category, setCategory] = useState(club.category || "");
  const [logoUrl, setLogoUrl] = useState(club.logoUrl || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { onError("Name is required."); return; }
    setSubmitting(true);
    try {
      const res = await updateClubMain(club._id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: undefined,
      });
      if (res?.success) onSuccess();
      else onError(res?.message || "Update failed.");
    } catch { onError("Update failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit — {club.name}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Club Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" /></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Logo URL</label><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" /></div>
        </div>
        <div className="flex gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden />
    </div>
  );
}

function AssignLeaderModal({ club, userId, onUserIdChange, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const id = userId.trim();
    if (!id) { onError("User ID is required."); return; }
    setSubmitting(true);
    try {
      const res = await assignClubLeader(club._id, id);
      if (res?.success) onSuccess();
      else onError(res?.message || "Assign failed.");
    } catch { onError("Assign failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Assign Leader — {club.name}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-500 mb-3">Enter the User ID (MongoDB ObjectId) of the club leader.</p>
          <input type="text" placeholder="User ID (e.g. 64abc...)" value={userId} onChange={(e) => onUserIdChange(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
        </div>
        <div className="flex gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Assign</button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden />
    </div>
  );
}
