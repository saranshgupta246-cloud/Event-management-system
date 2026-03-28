import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  ChevronRight,
  Calendar,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Star,
  MoreHorizontal,
  Send,
  UserCircle,
  X,
} from "lucide-react";
import api from "../../api/client";
import ApplicationDrawer from "../../components/leader/ApplicationDrawer";
import EmailComposerModal from "../../components/leader/EmailComposerModal";

const LEADER_PAGE_BG =
  "bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950";

const STATUS_OPTIONS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "selected", label: "Selected" },
  { id: "rejected", label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
];

const STATUS_META = {
  pending: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  shortlisted: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  interview: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  selected: { bg: "#F0FDF4", text: "#14532D", dot: "#22C55E" },
  rejected: { bg: "#FFF1F2", text: "#881337", dot: "#F43F5E" },
  withdrawn: { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

const DRIVE_STATUS_CLASS = {
  draft: "bg-slate-100 text-slate-600 dark:bg-[#161f2e] dark:text-slate-300",
  open: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  closed: "bg-slate-200 text-slate-600 dark:bg-[#1e2d42] dark:text-slate-300",
};

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 360);
}

function avatarColor(name) {
  const hue = hashToHue(name);
  return { bg: `hsl(${hue}, 55%, 45%)`, color: "#fff" };
}

function formatDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {(status && status.charAt(0).toUpperCase() + status.slice(1)) || "—"}
    </span>
  );
}

const KANBAN_COLUMNS = ["pending", "shortlisted", "interview", "selected", "rejected"];

function KanbanCard({ app, onView }) {
  const applicant = app.applicantId || {};
  const name = applicant.name || "Applicant";
  const color = avatarColor(name);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app._id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, rotate: isDragging ? "2deg" : "0", scale: isDragging ? 1.02 : 1 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-[#1e2d42] dark:bg-[#161f2e] ${
        isDragging ? "opacity-50 shadow-xl" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color.bg }}
        >
          {(name || "A").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(app.createdAt)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((r) => (
            <Star
              key={r}
              className={`h-3.5 w-3.5 ${(app.rating || 0) >= r ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(app._id);
          }}
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          View
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({ id, label, count, children }) {
  const meta = STATUS_META[id] || STATUS_META.pending;
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] flex-1 flex-col rounded-xl p-3 transition-colors ${
        isOver ? "border-2 border-dashed" : "bg-slate-50/50 dark:bg-[#161f2e]/60"
      }`}
      style={isOver ? { backgroundColor: `${meta.dot}15`, borderColor: `${meta.dot}4D` } : {}}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${meta.dot}20`, color: meta.text }}
        >
          {count}
        </span>
      </div>
      <div className="flex min-h-[400px] flex-col gap-2">{children}</div>
    </div>
  );
}

export default function LeaderApplicationsPage() {
  const { clubId, driveId } = useParams();
  const [drive, setDrive] = useState(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("table");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerApplicationId, setDrawerApplicationId] = useState(null);
  const [drawerApplication, setDrawerApplication] = useState(null);
  const [emailModalApplicationId, setEmailModalApplicationId] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [statusPopoverId, setStatusPopoverId] = useState(null);
  const [updatingRowStatus, setUpdatingRowStatus] = useState(null);
  const [updatingRowRating, setUpdatingRowRating] = useState(null);

  const appsFieldPrefix =
    clubId && driveId ? `leader-applications-${clubId}-${driveId}` : "leader-applications";

  const fetchDrive = useCallback(async () => {
    if (!clubId || !driveId) return;
    setDriveLoading(true);
    try {
      const res = await api.get(`/api/clubs/${clubId}/drives/${driveId}`);
      if (res.data?.success) setDrive(res.data.data);
      else setDrive(null);
    } catch {
      setDrive(null);
    } finally {
      setDriveLoading(false);
    }
  }, [clubId, driveId]);

  const fetchApplications = useCallback(async () => {
    if (!clubId || !driveId) return;
    setLoading(true);
    try {
    const params = new URLSearchParams();
    if (view === "table" && statusFilter) params.set("status", statusFilter);
    if (searchDebounced) params.set("search", searchDebounced);
    params.set("page", view === "kanban" ? "1" : String(page));
    params.set("limit", view === "kanban" ? "100" : "20");
      params.set("sortBy", sortBy === "rating" ? "rating" : "appliedAt");
      const res = await api.get(`/api/clubs/${clubId}/drives/${driveId}/applications?${params}`);
      if (res.data?.success) {
        setApplications(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        setStatusCounts(res.data.statusCounts || {});
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, driveId, statusFilter, searchDebounced, page, sortBy, view]);

  useEffect(() => {
    fetchDrive();
  }, [fetchDrive]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDrawerApplication = useCallback(async (id) => {
    if (!id) {
      setDrawerApplication(null);
      return;
    }
    try {
      const res = await api.get(`/api/applications/${id}`);
      if (res.data?.success) setDrawerApplication(res.data.data);
      else setDrawerApplication(null);
    } catch {
      setDrawerApplication(null);
    }
  }, []);

  useEffect(() => {
    if (drawerApplicationId) fetchDrawerApplication(drawerApplicationId);
    else setDrawerApplication(null);
  }, [drawerApplicationId, fetchDrawerApplication]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(applications.map((a) => a._id)));
  };

  const totalCount = Object.values(statusCounts).reduce((s, c) => s + c, 0);

  const runBulkStatus = async (status) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await api.post("/api/applications/bulk-status", { applicationIds: ids, status });
      setSelectedIds(new Set());
      fetchApplications();
    } catch {
      // could toast error
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    setUpdatingRowStatus(applicationId);
    setStatusPopoverId(null);
    try {
      await api.patch(`/api/applications/${applicationId}/status`, { status });
      fetchApplications();
    } catch {
      // ignore
    } finally {
      setUpdatingRowStatus(null);
    }
  };

  const updateApplicationRating = async (applicationId, rating) => {
    setUpdatingRowRating(applicationId);
    try {
      await api.patch(`/api/applications/${applicationId}/rating`, { rating });
      fetchApplications();
    } catch {
      // ignore
    } finally {
      setUpdatingRowRating(null);
    }
  };

  const clubName = drive?.clubId?.name || "Club";
  const driveTitle = drive?.title || "Drive";
  const driveStatus = drive?.status || "draft";
  const deadline = drive?.deadline;

  if (driveLoading && !drive) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 py-6 ${LEADER_PAGE_BG}`}>
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!drive && !driveLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 py-6 ${LEADER_PAGE_BG}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Drive not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The recruitment drive may have been removed or you don&apos;t have access.</p>
          <Link to="/leader/club" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Back to Club
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-6 md:px-6 md:py-6 ${LEADER_PAGE_BG}`}>
      <div className="mx-auto max-w-[1400px]">
        {/* Section 1: Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <Link to="/leader/club" className="hover:text-slate-700 dark:hover:text-slate-200">{clubName}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-700 dark:text-slate-300">{driveTitle}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-slate-900 dark:text-white">Applications</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{driveTitle}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DRIVE_STATUS_CLASS[driveStatus] || DRIVE_STATUS_CLASS.draft}`}>
                {driveStatus.charAt(0).toUpperCase() + driveStatus.slice(1)}
              </span>
            </div>
            {deadline && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                Deadline: {formatDate(deadline)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-[#2d3f55] dark:bg-[#161f2e]">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "kanban" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Section 2: Stats bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
          {[
            { key: "", label: "Total", count: totalCount, color: "#64748B" },
            { key: "pending", label: "Pending", count: statusCounts.pending ?? 0, color: STATUS_META.pending.dot },
            { key: "shortlisted", label: "Shortlisted", count: statusCounts.shortlisted ?? 0, color: STATUS_META.shortlisted.dot },
            { key: "interview", label: "Interview", count: statusCounts.interview ?? 0, color: STATUS_META.interview.dot },
            { key: "selected", label: "Selected", count: statusCounts.selected ?? 0, color: STATUS_META.selected.dot },
            { key: "rejected", label: "Rejected", count: statusCounts.rejected ?? 0, color: STATUS_META.rejected.dot },
          ].map(({ key, label, count, color }) => (
            <button
              key={key || "total"}
              type="button"
              onClick={() => {
                setStatusFilter(key);
                setPage(1);
              }}
              className={`flex flex-1 items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md dark:border-[#1e2d42] dark:bg-[#161f2e] sm:min-w-[120px] ${
                statusFilter === key ? "border-[#2563EB] bg-blue-50/50 shadow-sm dark:border-blue-500 dark:bg-blue-950/40" : "border-slate-200"
              }`}
              style={statusFilter === key && key ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${color}20` }}>
                <UserCircle className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Section 3: Toolbar */}
        {selectedIds.size === 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={`${appsFieldPrefix}-search`}
                name={`${appsFieldPrefix}-search`}
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((b) => !b)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {statusFilter ? STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "Status" : "Status"}
                <ChevronDown className="h-4 w-4" />
              </button>
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-[#2d3f55] dark:bg-[#161f2e]">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id || "all"}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.id);
                          setPage(1);
                          setStatusDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {opt.id && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: STATUS_META[opt.id]?.dot || "#94A3B8" }}
                          />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen((b) => !b)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-[#2d3f55] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {sortBy === "rating" ? "Rating" : "Newest First"}
                <ChevronDown className="h-4 w-4" />
              </button>
              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setSortDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-[#2d3f55] dark:bg-[#161f2e]">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("newest");
                        setSortDropdownOpen(false);
                        fetchApplications();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Newest First
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("rating");
                        setSortDropdownOpen(false);
                        fetchApplications();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Rating
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-[#2d3f55]" />
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-[#2d3f55] dark:bg-[#161f2e]">
              <button
                type="button"
                onClick={() => setView("table")}
                className={`rounded-md px-3 py-2 text-sm ${view === "table" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`rounded-md px-3 py-2 text-sm ${view === "kanban" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Bulk action bar - fixed at bottom on mobile */
          <div className="fixed bottom-0 left-0 right-0 z-30 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-none bg-blue-600 px-4 py-3 text-white shadow-lg md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:mb-4 md:rounded-xl">
            <span className="text-sm font-medium">{selectedIds.size} applicants selected</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runBulkStatus("shortlisted")}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10"
              >
                Shortlist
              </button>
              <button
                type="button"
                onClick={() => runBulkStatus("rejected")}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.size > 0) {
                    const first = Array.from(selectedIds)[0];
                    setDrawerApplicationId(first);
                    setEmailModalApplicationId(first);
                  }
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10"
              >
                Send Email
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Section 4A: Table view */}
        {view === "table" && (
          <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e] ${selectedIds.size > 0 ? "pb-24 md:pb-0" : ""}`}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UserCircle className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">No applications yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Applications will appear here when students apply to this drive.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e]/80">
                      <th className="sticky left-0 z-10 w-10 border-r border-slate-100 bg-slate-50 px-4 py-3 text-left dark:border-[#1e2d42] dark:bg-[#161f2e]/80">
                        <input
                          id={`${appsFieldPrefix}-select-all`}
                          name={`${appsFieldPrefix}-select-all`}
                          type="checkbox"
                          checked={applications.length > 0 && selectedIds.size === applications.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="sticky left-10 z-10 min-w-[200px] border-r border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e]/80 dark:text-slate-400">Applicant</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Rating</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const applicant = app.applicantId || {};
                      const name = applicant.name || "Applicant";
                      const color = avatarColor(name);
                      return (
                        <tr
                          key={app._id}
                          className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-[#1e2d42] dark:hover:bg-slate-800/50 ${
                            selectedIds.has(app._id) ? "border-b border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30" : ""
                          }`}
                          onClick={() => setDrawerApplicationId(app._id)}
                        >
                          <td className="sticky left-0 z-10 w-10 border-r border-slate-100 bg-white px-4 py-3.5 dark:border-[#1e2d42] dark:bg-[#161f2e]" onClick={(e) => e.stopPropagation()}>
                            <input
                              id={`${appsFieldPrefix}-select-${app._id}`}
                              name={`${appsFieldPrefix}-select-${app._id}`}
                              type="checkbox"
                              checked={selectedIds.has(app._id)}
                              onChange={() => toggleSelect(app._id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="sticky left-10 z-10 min-w-[200px] border-r border-slate-100 bg-white px-4 py-3.5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ backgroundColor: color.bg }}
                              >
                                {(name || "A").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{applicant.email || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">{formatDate(app.createdAt)}</td>
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setStatusPopoverId(statusPopoverId === app._id ? null : app._id)}
                                className="inline-flex"
                              >
                                <StatusPill status={app.status} />
                              </button>
                              {statusPopoverId === app._id && (
                                <>
                                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStatusPopoverId(null)} />
                                  <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-[#2d3f55] dark:bg-[#161f2e]">
                                    {["shortlisted", "interview", "selected", "rejected"].map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => updateApplicationStatus(app._id, s)}
                                        disabled={updatingRowStatus === app._id}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-700"
                                      >
                                        <StatusPill status={s} />
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => updateApplicationRating(app._id, r)}
                                  disabled={updatingRowRating === app._id}
                                  className="p-0.5"
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      (app.rating || 0) >= r ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-200"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDrawerApplicationId(app._id)}
                                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                View
                              </button>
                              <button type="button" className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && applications.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 dark:border-[#1e2d42]">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applicants
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const p = pagination.pages <= 5 ? i + 1 : Math.max(1, Math.min(pagination.pages - 2, pagination.page - 2)) + i;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                            pagination.page === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4B: Kanban view */}
        {view === "kanban" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">Loading...</div>
            ) : (
              <DndContext
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (over?.id && active?.id && KANBAN_COLUMNS.includes(String(over.id))) {
                    updateApplicationStatus(String(active.id), String(over.id));
                  }
                }}
              >
                <div className="flex gap-4 min-w-max">
                  {KANBAN_COLUMNS.map((statusKey) => {
                    const columnApps = applications.filter((a) => a.status === statusKey);
                    const label = (statusKey && statusKey.charAt(0).toUpperCase() + statusKey.slice(1)) || "—";
                    return (
                      <KanbanColumn
                        key={statusKey}
                        id={statusKey}
                        label={label}
                        count={columnApps.length}
                      >
                        {columnApps.map((app) => (
                          <KanbanCard key={app._id} app={app} onView={setDrawerApplicationId} />
                        ))}
                      </KanbanColumn>
                    );
                  })}
                </div>
              </DndContext>
            )}
          </div>
        )}

        {/* Drawer */}
        {drawerApplicationId && (
          <div className="fixed inset-0 z-40 flex justify-end md:items-stretch">
            <div className="absolute inset-0 bg-slate-900/50 md:bg-slate-900/40" aria-hidden onClick={() => setDrawerApplicationId(null)} />
            <div
              className="relative flex h-[85vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-[#161f2e] md:h-full md:max-h-none md:rounded-none md:w-[420px]"
              style={{ animation: "slideIn 0.3s ease-out" }}
            >
              <ApplicationDrawer
                application={drawerApplication}
                onClose={() => setDrawerApplicationId(null)}
                onRefresh={fetchApplications}
                onOpenEmail={() => setEmailModalApplicationId(drawerApplicationId)}
              />
            </div>
          </div>
        )}

        {emailModalApplicationId && (
          <EmailComposerModal
            applicationId={emailModalApplicationId}
            application={drawerApplication}
            onClose={() => setEmailModalApplicationId(null)}
            onSent={() => {
              setEmailModalApplicationId(null);
              if (drawerApplicationId) fetchDrawerApplication(drawerApplicationId);
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
