import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { Users, Building2, Search } from "lucide-react";

const ROLE_COLORS = {
  "Faculty Coordinator": "#7C3AED",
  President: "#2563EB",
  Secretary: "#16A34A",
  Treasurer: "#7C3AED",
  "Core Member": "#0891B2",
  Volunteer: "#D97706",
  Member: "#6B7280",
};

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || "#6B7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {role || "Member"}
    </span>
  );
}

export default function AdminClubUsersPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    api
      .get("/api/clubs?limit=100")
      .then((res) => setClubs(res.data?.data || []))
      .catch(() => setClubs([]))
      .finally(() => setClubsLoading(false));
  }, []);

  const fetchMembers = useCallback(async () => {
    if (!selectedClub) {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status:
          statusFilter === "active" ? "active" : statusFilter === "inactive" ? "inactive" : "all",
      });
      if (roleFilter) params.set("clubRole", roleFilter);
      const res = await api.get(`/api/admin/clubs/${selectedClub}/members?${params}`);
      const data = res.data?.data || {};
      const core = data.coreTeam || [];
      const rest = data.others || [];
      setMembers([...core, ...rest]);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClub, roleFilter, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.userId?.name?.toLowerCase().includes(q) ||
        m.userId?.email?.toLowerCase().includes(q) ||
        String(m.userId?.studentId || "")
          .toLowerCase()
          .includes(q),
    );
  }, [members, search]);

  const activeCount = members.filter((m) => m.status === "approved").length;
  const inactiveCount = members.filter((m) => m.status === "inactive").length;
  const selectedClubName =
    clubs.find((c) => String(c._id) === String(selectedClub))?.name || "";

  const ROLE_OPTIONS = [
    "Faculty Coordinator",
    "President",
    "Secretary",
    "Treasurer",
    "Core Member",
    "Volunteer",
    "Member",
  ];

  return (
    <div className="admin-page-shell flex min-w-0 flex-1 flex-col overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Club Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View all members across clubs. Select a club to see its team.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Club</label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              disabled={clubsLoading}
              className="h-9 min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
            >
              <option value="">Select a club</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Search</label>
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, ID..."
                className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          </div>
        </div>

        {selectedClub && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Members
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{members.length}</p>
              <p className="mt-1 text-xs text-slate-400">{selectedClubName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Active</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
              <p className="mt-1 text-xs text-slate-400">Currently active</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-1 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inactive</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{inactiveCount}</p>
              <p className="mt-1 text-xs text-slate-400">Deactivated members</p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          {!selectedClub ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Building2 className="h-12 w-12 text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Select a club to view its members
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Users className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No members found.</p>
            </div>
          ) : (
            <>
              <div className="hidden flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-[#1e2d42] dark:bg-[#161f2e]/60 dark:text-slate-500 sm:flex sm:flex-nowrap">
                <div className="min-w-0 flex-1">Member</div>
                <div className="w-32 shrink-0 sm:w-36">Enrollment ID</div>
                <div className="w-32 shrink-0 sm:w-36">Role</div>
                <div className="w-28 shrink-0 sm:w-32">Joined</div>
                <div className="w-24 shrink-0">Status</div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((m) => {
                  const isActive = m.status === "approved";
                  return (
                    <div
                      key={m._id}
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center dark:hover:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {m.userId?.avatar ? (
                          <img
                            src={m.userId.avatar}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                            {m.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {m.userId?.name || "\u2014"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {m.userId?.email || "\u2014"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-sm text-slate-600 dark:text-slate-300 sm:w-36">
                        {m.userId?.studentId || "\u2014"}
                      </div>
                      <div className="shrink-0 sm:w-36">
                        <RoleBadge role={m.role || m.clubRole} />
                      </div>
                      <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:w-32">
                        {m.joinedAt
                          ? new Date(m.joinedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "\u2014"}
                      </div>
                      <div className="shrink-0 sm:w-24">
                        {isActive ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400 dark:border-[#1e2d42] dark:text-slate-500">
                Showing {filteredMembers.length} of {members.length} members
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
