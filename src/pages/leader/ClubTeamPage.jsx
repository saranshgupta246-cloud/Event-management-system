import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Shield,
  Users,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Star,
  Search,
  ChevronDown,
  ArrowRight,
  X,
  Check,
  UserPlus,
} from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ROLE_RANK = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};
const CORE_ROLES = ["President", "Secretary", "Treasurer"];
const MEMBER_ROLES = ["President", "Secretary", "Treasurer", "Core Member", "Volunteer", "Member"];

const ROLE_COLORS = {
  President: "#2563EB",
  Secretary: "#16A34A",
  Treasurer: "#7C3AED",
  "Core Member": "#0891B2",
  Volunteer: "#D97706",
  Member: "#6B7280",
};

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(roleOrId) {
  const hex = typeof roleOrId === "string" && ROLE_COLORS[roleOrId]
    ? ROLE_COLORS[roleOrId]
    : "#6B7280";
  return { bg: `${hex}20`, text: hex };
}

function formatDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function ClubTeamPage({ useLeaderApi }) {
  const { clubId } = useParams();
  const { user: authUser } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyMember, setHistoryMember] = useState(null);
  const [roleHistory, setRoleHistory] = useState([]);
  const [promotedId, setPromotedId] = useState(null);
  const coreSectionRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [bulkSelect, setBulkSelect] = useState(false);
  const [rolePopover, setRolePopover] = useState(null);
  const [toast, setToast] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchClub = useCallback(async () => {
    if (useLeaderApi) {
      try {
        const res = await api.get("/api/leader/club");
        setClub(res.data?.data || null);
      } catch {
        setClub(null);
      }
      return;
    }
    if (!clubId) return;
    try {
      const res = await api.get(`/api/clubs/${clubId}`);
      setClub(res.data?.data || null);
    } catch {
      setClub(null);
    }
  }, [clubId, useLeaderApi]);

  const fetchMembers = useCallback(async () => {
    if (useLeaderApi) {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (roleFilter) params.set("clubRole", roleFilter);
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        params.set("limit", "500");
        const res = await api.get(`/api/leader/club/members?${params.toString()}`);
        const data = res.data?.data || {};
        const core = (data.coreTeam || []).map((m) => ({ ...m, role: m.clubRole || m.role, enrollmentId: m.userId?.studentId ?? m.enrollmentId }));
        const rest = (data.others || []).map((m) => ({ ...m, role: m.clubRole || m.role, enrollmentId: m.userId?.studentId ?? m.enrollmentId }));
        setMembers([...core, ...rest]);
        const all = [...core, ...rest];
        const myMember = all.find((m) => String(m.userId?._id) === String(authUser?._id));
        if (myMember != null) {
          setMyRank(myMember.roleRank);
        } else if (authUser?.role === "club_leader" || authUser?.role === "admin") {
          setMyRank(1); // club_leader always gets President rank
        } else if (myRank === null) {
          setMyRank(6);
        }
      } catch {
        setMembers([]);
      }
      return;
    }
    if (!clubId) return;
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "500");
      const res = await api.get(`/api/clubs/${clubId}/members?${params.toString()}`);
      const list = (res.data?.data || []).map((m) => ({ ...m, role: m.role || m.clubRole }));
      setMembers(list);
      const myMember = list.find((m) => String(m.userId?._id) === String(authUser?._id));
      if (myMember != null) {
        setMyRank(myMember.roleRank);
      } else if (authUser?.role === "club_leader" || authUser?.role === "admin") {
        setMyRank(1); // club_leader always gets President rank
      } else if (myRank === null) {
        setMyRank(6);
      }
    } catch {
      setMembers([]);
    }
  }, [clubId, debouncedSearch, roleFilter, statusFilter, authUser?._id, useLeaderApi]);

  useEffect(() => {
    if (!useLeaderApi && !clubId) return;
    setLoading(true);
    Promise.all([fetchClub(), fetchMembers()]).finally(() => setLoading(false));
  }, [clubId, useLeaderApi, fetchClub, fetchMembers]);

  const coreTeam = useMemo(() => {
    const core = members.filter((m) => m.roleRank <= 3);
    const byRole = {};
    CORE_ROLES.forEach((r) => (byRole[r] = core.find((m) => m.role === r)));
    return byRole;
  }, [members]);

  const tableMembers = useMemo(
    () => members.filter((m) => m.roleRank > 3),
    [members]
  );

  const canChangeRole = (targetRank) => myRank != null && myRank < targetRank && myRank <= 2;
  const canAddMember = myRank != null && myRank <= 2;
  const canRemove = (targetRank) => myRank != null && myRank < targetRank && myRank <= 2;

  const openHistory = useCallback(async (member) => {
    setHistoryMember(member);
    setHistoryDrawerOpen(true);
    try {
      const url = useLeaderApi
        ? `/api/leader/club/members/${member._id}/role-history`
        : `/api/clubs/${clubId}/members/${member._id}/role-history`;
      const res = await api.get(url);
      setRoleHistory(res.data?.data || []);
    } catch {
      setRoleHistory([]);
    }
  }, [clubId, useLeaderApi]);

  const handleRoleChange = useCallback(
    async (memberId, newRole, reason) => {
      try {
        const url = useLeaderApi
          ? `/api/leader/club/members/${memberId}/role`
          : `/api/clubs/${clubId}/members/${memberId}/role`;
        const body = useLeaderApi ? { clubRole: newRole, reason: reason || undefined } : { role: newRole, reason: reason || undefined };
        const res = await api.patch(url, body);
        const updated = res.data?.data;
        const prev = members.find((m) => m._id === memberId);
        const wasPromotion = prev && updated && ROLE_RANK[newRole] <= 3 && ROLE_RANK[prev.role] > 3;
        setRolePopover(null);
        await fetchMembers();
        await fetchClub();
        if (wasPromotion) {
          setPromotedId(updated?.userId?._id || memberId);
          coreSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          setToast({ message: `🎉 ${updated?.userId?.name || "Member"} promoted to ${newRole}!`, key: Date.now() });
          setTimeout(() => setPromotedId(null), 1500);
          setTimeout(() => setToast(null), 3000);
        }
      } catch (e) {
        const msg = e.response?.data?.message || "Failed to update role";
        setToast({ message: msg, error: true, key: Date.now() });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [clubId, useLeaderApi, members, fetchMembers, fetchClub]
  );

  const handleRemoveMember = useCallback(
    async (memberId) => {
      try {
        const url = useLeaderApi ? `/api/leader/club/members/${memberId}` : `/api/clubs/${clubId}/members/${memberId}`;
        await api.delete(url);
        fetchMembers();
        fetchClub();
        setToast({ message: "Member removed", key: Date.now() });
        setTimeout(() => setToast(null), 2000);
      } catch {
        setToast({ message: "Failed to remove", error: true, key: Date.now() });
        setTimeout(() => setToast(null), 2000);
      }
    },
    [clubId, useLeaderApi, fetchMembers, fetchClub]
  );

  const handleDeactivate = useCallback(
    async (memberId) => {
      try {
        const url = useLeaderApi ? `/api/leader/club/members/${memberId}` : `/api/clubs/${clubId}/members/${memberId}`;
        await api.delete(url);
        fetchMembers();
        fetchClub();
        setToast({ message: "Member deactivated", key: Date.now() });
        setTimeout(() => setToast(null), 2000);
      } catch {
        setToast({ message: "Failed to deactivate", error: true, key: Date.now() });
        setTimeout(() => setToast(null), 2000);
      }
    },
    [clubId, useLeaderApi, fetchMembers, fetchClub]
  );

  const handleReactivate = useCallback(
    async (memberId) => {
      try {
        const url = useLeaderApi
          ? `/api/leader/club/members/${memberId}/reactivate`
          : `/api/clubs/${clubId}/members/${memberId}/reactivate`;
        await api.patch(url, { status: "approved" });
        fetchMembers();
        fetchClub();
        setToast({ message: "Member reactivated", key: Date.now() });
        setTimeout(() => setToast(null), 2000);
      } catch {
        setToast({
          message: "Failed to reactivate",
          error: true,
          key: Date.now(),
        });
        setTimeout(() => setToast(null), 2000);
      }
    },
    [clubId, useLeaderApi, fetchMembers, fetchClub]
  );

  if (loading && !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50">
        <p className="text-slate-600">Club not found.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50 px-4 py-6 md:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl" style={{ letterSpacing: "-0.02em" }}>
              Team Management
            </h1>
            <p className="mt-1 text-base text-slate-600" style={{ lineHeight: 1.6 }}>
              Manage your core team, volunteers, and general members
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            disabled={!canAddMember}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="h-5 w-5" />
            Add New Member
          </button>
        </div>

        {/* Section 1: Core Team */}
        <section ref={coreSectionRef} className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Core Team</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x snap-mandatory md:snap-align-none">
            {CORE_ROLES.map((role) => {
              const member = coreTeam[role];
              const roleColor = ROLE_COLORS[role];
              const isEmpty = !member;
              return (
                <div
                  key={role}
                  className="flex-shrink-0 w-full min-w-[280px] max-w-md md:min-w-0 snap-center rounded-2xl border-2 bg-white transition-all duration-200 hover:shadow-lg overflow-hidden"
                  style={{
                    borderColor: `${roleColor}33`,
                    boxShadow: promotedId && member?.userId?._id === promotedId ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
                    animation: promotedId && member?.userId?._id === promotedId ? "promoCard 0.4s cubic-bezier(0.16,1,0.3,1)" : undefined,
                  }}
                >
                  <div className="rounded-t-2xl" style={{ height: "4px", backgroundColor: roleColor }} aria-hidden />
                  <div className="p-5">
                  <div className="flex justify-between items-start">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}
                    >
                      {role}
                    </span>
                    {!isEmpty && canChangeRole(ROLE_RANK[role]) && (
                      <CoreCardMenu
                        member={member}
                        onChangeRole={() => setRolePopover({ type: "core", member, role })}
                        onViewHistory={() => openHistory(member)}
                        onRemove={() => handleRemoveMember(member._id)}
                      />
                    )}
                  </div>
                  {isEmpty ? (
                    <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-bold">
                        —
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-500">Vacant</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative mt-3 inline-block">
                        <div
                          className="h-16 w-16 rounded-full bg-cover bg-center flex items-center justify-center text-xl font-bold text-white border-2 border-white shadow"
                          style={{
                            backgroundColor: member.userId?.avatar ? "transparent" : getAvatarColor(role).text,
                            backgroundImage: member.userId?.avatar ? `url(${member.userId.avatar})` : undefined,
                          }}
                        >
                          {!member.userId?.avatar && getInitials(member.userId?.name)}
                        </div>
                        {role === "President" && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-400 p-1 text-amber-900">
                            <Star className="h-4 w-4 fill-current" />
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-lg font-bold text-slate-900">{member.userId?.name || "—"}</p>
                      <div className="mt-3 space-y-1">
                        <p className="flex items-center gap-2 text-sm text-slate-600 truncate">
                          <Mail className="h-4 w-4 shrink-0" />
                          {member.userId?.email || "—"}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4 shrink-0" />
                          {member.userId?.phone || "+91 —"}
                        </p>
                      </div>
                      {canChangeRole(ROLE_RANK[role]) && (
                        <button
                          type="button"
                          onClick={() => setRolePopover({ type: "core", member, role })}
                          className="mt-4 w-full rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-opacity-5"
                          style={{ borderColor: `${roleColor}4D`, color: roleColor }}
                        >
                          Change Role
                        </button>
                      )}
                    </>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Volunteers & Members */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Users className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Volunteers & Members</h2>
            <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-700">
              {tableMembers.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All roles</option>
              {["Core Member", "Volunteer", "Member"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
            <button
              type="button"
              onClick={() => setBulkSelect((b) => !b)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Select Multiple
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Member</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Enrollment ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Join date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableMembers.map((m) => (
                  <TableRow
                    key={m._id}
                    member={m}
                    canChange={canChangeRole(m.roleRank)}
                    onRoleClick={() => setRolePopover({ type: "table", member: m })}
                    onViewHistory={() => openHistory(m)}
                    onDeactivate={() => handleDeactivate(m._id)}
                    onReactivate={() => handleReactivate(m._id)}
                    popoverOpen={rolePopover?.type === "table" && rolePopover?.member?._id === m._id}
                    onClosePopover={() => setRolePopover(null)}
                    onRoleChange={handleRoleChange}
                    myRank={myRank}
                  />
                ))}
              </tbody>
            </table>
            {tableMembers.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">No volunteers or members yet.</div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tableMembers.map((m) => (
              <MemberCard
                key={m._id}
                member={m}
                canChange={canChangeRole(m.roleRank)}
                onRoleClick={() => setRolePopover({ type: "table", member: m })}
                onViewHistory={() => openHistory(m)}
                onDeactivate={() => handleDeactivate(m._id)}
                onRoleChange={handleRoleChange}
                myRank={myRank}
                rolePopoverOpen={rolePopover?.type === "table" && rolePopover?.member?._id === m._id}
                onClosePopover={() => setRolePopover(null)}
              />
            ))}
            {tableMembers.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
                No volunteers or members yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Role Change Popover (desktop: popover; mobile: bottom sheet handled in row/card) */}
      {rolePopover?.member && (
        <RoleChangePopover
          member={rolePopover.member}
          currentRole={rolePopover.member.role}
          onClose={() => setRolePopover(null)}
          onConfirm={handleRoleChange}
          myRank={myRank}
          isMobile={false}
        />
      )}

      {/* Role History Drawer */}
      <RoleHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => { setHistoryDrawerOpen(false); setHistoryMember(null); }}
        member={historyMember}
        logs={roleHistory}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        clubId={clubId}
        useLeaderApi={useLeaderApi}
        onAdded={() => { setAddModalOpen(false); fetchMembers(); fetchClub(); }}
        myRank={myRank}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg animate-fadeIn"
          style={{
            backgroundColor: toast.error ? "#FEE2E2" : "#F0FDF4",
            color: toast.error ? "#991B1B" : "#14532D",
          }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes promoCard {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function CoreCardMenu({ member, onChangeRole, onViewHistory, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { setOpen(false); onChangeRole(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              Change Role
            </button>
            <button type="button" onClick={() => { setOpen(false); onViewHistory(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              View History
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button type="button" onClick={() => { setOpen(false); onRemove(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TableRow({
  member,
  canChange,
  onRoleClick,
  onViewHistory,
  onDeactivate,
  onReactivate,
  popoverOpen,
  onClosePopover,
  onRoleChange,
  myRank,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const roleColor = ROLE_COLORS[member.role] || "#6B7280";
  const isActive = member.status === "active";
  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
            style={{ backgroundColor: roleColor }}
          >
            {member.userId?.avatar ? (
              <img src={member.userId.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              getInitials(member.userId?.name)
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{member.userId?.name || "—"}</p>
            <p className="text-xs text-slate-500">{member.userId?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{member.enrollmentId || "—"}</td>
      <td className="px-4 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => canChange && onRoleClick()}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${canChange ? "cursor-pointer hover:ring-2 hover:ring-blue-300" : ""}`}
            style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}
          >
            {member.role}
          </button>
          {popoverOpen && (
            <RoleChangePopover
              member={member}
              currentRole={member.role}
              onClose={onClosePopover}
              onConfirm={onRoleChange}
              myRank={myRank}
              anchor="table"
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.joinedAt)}</td>
      <td className="px-4 py-3">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {canChange && <button type="button" onClick={() => { setMenuOpen(false); onRoleClick(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Change Role</button>}
                <button type="button" onClick={() => { setMenuOpen(false); onViewHistory(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">View Role History</button>
                <div className="my-1 border-t border-slate-100" />
                {isActive ? (
                  <button type="button" onClick={() => { setMenuOpen(false); onDeactivate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Deactivate</button>
                ) : (
                  <button type="button" onClick={() => { setMenuOpen(false); onReactivate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Reactivate</button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MemberCard({
  member,
  canChange,
  onRoleClick,
  onViewHistory,
  onDeactivate,
  onRoleChange,
  myRank,
  rolePopoverOpen,
  onClosePopover,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const roleColor = ROLE_COLORS[member.role] || "#6B7280";
  const isActive = member.status === "active";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0" style={{ backgroundColor: roleColor }}>
            {member.userId?.avatar ? <img src={member.userId.avatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : getInitials(member.userId?.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{member.userId?.name || "—"}</p>
            <p className="text-xs text-slate-500">{member.userId?.email}</p>
          </div>
        </div>
        <button type="button" onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="font-mono text-slate-600">{member.enrollmentId || "—"}</span>
        <button
          type="button"
          onClick={() => canChange && onRoleClick()}
          className={`rounded-full px-2.5 py-1 font-medium ${canChange ? "cursor-pointer" : ""}`}
          style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}
        >
          {member.role}
        </button>
        <span className={isActive ? "text-green-600" : "text-slate-400"}>{isActive ? "Active" : "Inactive"}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">Joined {formatDate(member.joinedAt)}</p>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
          <div className="absolute right-4 left-4 bottom-20 z-20 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {canChange && <button type="button" onClick={() => { setMenuOpen(false); onRoleClick(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Change Role</button>}
            <button type="button" onClick={() => { setMenuOpen(false); onViewHistory(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">View Role History</button>
            <div className="my-1 border-t border-slate-100" />
            {isActive ? <button type="button" onClick={() => { setMenuOpen(false); onDeactivate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Deactivate</button> : <button type="button" onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Reactivate</button>}
          </div>
        </>
      )}
      {rolePopoverOpen && (
        <RoleChangePopover
          member={member}
          currentRole={member.role}
          onClose={onClosePopover}
          onConfirm={onRoleChange}
          myRank={myRank}
          isMobile
        />
      )}
    </div>
  );
}

function RoleChangePopover({ member, currentRole, onClose, onConfirm, myRank, anchor, isMobile }) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isPromotion = selectedRole && ROLE_RANK[selectedRole] <= 3 && ROLE_RANK[currentRole] > 3;
  const allowedRoles = MEMBER_ROLES.filter((r) => myRank != null && ROLE_RANK[r] > myRank);

  const handleConfirm = async () => {
    if (selectedRole === currentRole) return onClose();
    setSubmitting(true);
    await onConfirm(member._id, selectedRole, reason);
    setSubmitting(false);
  };

  const content = (
    <div className="w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-30">
      <h3 className="text-sm font-semibold text-slate-800">Change role for {member.userId?.name || "Member"}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">Currently: {currentRole}</p>
      <div className="space-y-1">
        {allowedRoles.map((role) => {
          const rank = ROLE_RANK[role];
          const currentRank = ROLE_RANK[currentRole];
          const note = rank < currentRank ? "↑ Promotion" : rank > currentRank ? "↓ Demotion" : null;
          const isSelected = selectedRole === role;
          const color = ROLE_COLORS[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${isSelected ? "border" : ""}`}
              style={isSelected ? { backgroundColor: `${color}14`, borderColor: `${color}33` } : {}}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{role}</p>
                {note && <p className="text-xs text-slate-500">{note}</p>}
              </div>
              {isSelected && <Check className="h-4 w-4 text-slate-600 shrink-0" />}
            </button>
          );
        })}
      </div>
      {isPromotion && (
        <div className="mt-3 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-700">
          ⬆️ This will move {member.userId?.name || "this member"} to Core Team
        </div>
      )}
      <div className="mt-3">
        <label className="block text-xs text-slate-500 mb-1">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Optional note..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>
      <div className="mt-4 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedRole === currentRole || submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 md:hidden">
        <div className="w-full max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 flex justify-end p-2 border-b border-slate-100">
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 pb-8">{content}</div>
        </div>
        <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden />
      </div>
    );
  }

  if (anchor === "table") {
    return (
      <div className="absolute left-0 top-full z-30 mt-1">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />
      {content}
    </div>
  );
}

function RoleHistoryDrawer({ open, onClose, member, logs }) {
  const byDate = useMemo(() => {
    const map = {};
    (logs || []).forEach((log) => {
      const d = formatDate(log.changedAt);
      if (!map[d]) map[d] = [];
      map[d].push(log);
    });
    return map;
  }, [logs]);

  if (!open) return null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const drawerContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{member?.userId?.name || "Member"}'s Role History</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto">
        {Object.entries(byDate).length === 0 ? (
          <p className="text-sm text-slate-500">No role changes yet.</p>
        ) : (
          Object.entries(byDate).map(([date, entries]) => (
            <div key={date} className="mb-4">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 mb-2">{date}</span>
              {entries.map((log, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.fromRole ? (
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${ROLE_COLORS[log.fromRole] || "#6B7280"}20`, color: ROLE_COLORS[log.fromRole] || "#6B7280" }}>{log.fromRole}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${ROLE_COLORS[log.toRole] || "#6B7280"}20`, color: ROLE_COLORS[log.toRole] || "#6B7280" }}>{log.toRole}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    {log.changedBy?.avatar && <img src={log.changedBy.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />}
                    Changed by {log.changedBy?.name || "—"}
                  </p>
                  {log.reason && <p className="mt-1 text-sm text-slate-600 italic">{log.reason}</p>}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30" style={{ visibility: open ? "visible" : "hidden" }}>
        <div className="bg-white rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {drawerContent}
        </div>
        <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" style={{ visibility: open ? "visible" : "hidden" }}>
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />
      <div className="absolute right-0 top-0 bottom-0 w-[360px] bg-white border-l border-slate-200 shadow-xl flex flex-col">
        {drawerContent}
      </div>
    </div>
  );
}

function AddMemberModal({ open, onClose, clubId, useLeaderApi, onAdded, myRank }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (!open || !debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const url = useLeaderApi
      ? `/api/leader/club/members/search-users?q=${encodeURIComponent(debouncedQuery)}`
      : `/api/clubs/${clubId}/members/search-users?q=${encodeURIComponent(debouncedQuery)}`;
    api.get(url)
      .then((res) => {
        if (!cancelled) setResults(res.data?.data || []);
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [open, clubId, useLeaderApi, debouncedQuery]);

  const handleAdd = async () => {
    if (!selectedUser || !selectedRole) return;
    setSubmitting(true);
    try {
      if (useLeaderApi) {
        await api.post("/api/leader/club/members", { userId: selectedUser._id, clubRole: selectedRole });
      } else {
        await api.post(`/api/clubs/${clubId}/members`, { userId: selectedUser._id, role: selectedRole });
      }
      onAdded?.();
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to add member";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const allowedRoles = MEMBER_ROLES.filter((r) => myRank != null && ROLE_RANK[r] > myRank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Add New Member</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
            {selectedUser && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1.5 text-sm">
                {selectedUser.name} <button type="button" onClick={() => setSelectedUser(null)} className="hover:bg-blue-200 rounded-full p-0.5"><X className="h-4 w-4" /></button>
              </div>
            )}
            {!selectedUser && debouncedQuery.length >= 2 && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {searching ? <p className="p-3 text-sm text-slate-500">Searching...</p> : results.length === 0 ? <p className="p-3 text-sm text-slate-500">No users found.</p> : results.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    disabled={u.isAlreadyMember}
                    onClick={() => !u.isAlreadyMember && setSelectedUser(u)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed border-b border-slate-50 last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                      {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{u.enrollmentId || u.studentId || "—"}</span>
                    {u.isAlreadyMember && <span className="text-xs text-slate-400 bg-slate-100 rounded px-2 py-0.5">Already a member</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Role</p>
            <div className="grid grid-cols-2 gap-2">
              {MEMBER_ROLES.map((role) => {
                const color = ROLE_COLORS[role];
                const allowed = allowedRoles.includes(role);
                const selected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={!allowed}
                    onClick={() => allowed && setSelectedRole(role)}
                    title={!allowed ? "Insufficient rank" : undefined}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${!allowed ? "opacity-40 cursor-not-allowed" : ""} ${selected ? "" : "border-transparent bg-slate-50 hover:bg-slate-100"}`}
                    style={selected ? { borderColor: color, backgroundColor: `${color}14` } : {}}
                  >
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-slate-800">{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedUser || !selectedRole || submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-[0_1px_2px_rgba(37,99,235,0.3)]"
          >
            Add to Club
          </button>
        </div>
      </div>
    </div>
  );
}
