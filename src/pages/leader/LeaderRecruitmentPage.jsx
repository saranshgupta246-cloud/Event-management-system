import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Calendar,
  Users,
  FileQuestion,
  AlertCircle,
  Trash2,
  Rocket,
  Pause,
  Play,
  X,
} from "lucide-react";
import api from "../../api/client";
import CreateDriveModal from "../../components/leader/CreateDriveModal";

const DRIVE_STATUS_META = {
  draft: { label: "Draft", bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  open: { label: "Open", bg: "#F0FDF4", text: "#14532D", dot: "#22C55E" },
  paused: { label: "Paused", bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  closed: { label: "Closed", bg: "#FFF1F2", text: "#881337", dot: "#F43F5E" },
};

function formatDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DriveStatusPill({ status }) {
  const meta = DRIVE_STATUS_META[status] || DRIVE_STATUS_META.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
}

function DriveCard({ drive, clubId, onEdit, onRefetch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating, setUpdating] = useState(false);

  const status = drive.status || "draft";
  const daysLeft = drive.daysLeft;
  const isUrgent = daysLeft !== null && daysLeft < 3;
  const applicantCount = drive.applicantCount ?? 0;
  const shortlistedCount = drive.shortlistedCount ?? 0;
  const selectedCount = drive.selectedCount ?? 0;
  const questionCount = (drive.customQuestions || []).length;

  const handleStatusChange = useCallback(
    async (newStatus) => {
      setConfirmAction(null);
      setUpdating(true);
      try {
        await api.patch(`/api/clubs/${clubId}/drives/${drive._id}`, { status: newStatus });
        onRefetch?.();
      } catch {
        // ignore
      } finally {
        setUpdating(false);
      }
    },
    [clubId, drive._id, onRefetch]
  );

  const handleDelete = useCallback(async () => {
    setConfirmAction(null);
    setUpdating(true);
    try {
      await api.delete(`/api/clubs/${clubId}/drives/${drive._id}`);
      onRefetch?.();
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  }, [clubId, drive._id, onRefetch]);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">{drive.roleTitle || drive.title}</h2>
          <DriveStatusPill status={status} />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit?.(drive); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                {status === "open" && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmAction("pause"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Pause
                  </button>
                )}
                {status === "paused" && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmAction("resume"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Resume
                  </button>
                )}
                {(status === "open" || status === "paused") && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmAction("close"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Close Drive
                  </button>
                )}
                {status === "draft" && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmAction("delete"); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className={isUrgent ? "text-red-600" : ""}>
          <Calendar className="inline h-4 w-4 align-middle" /> Deadline: {formatDate(drive.deadline)}
        </span>
        <span>·</span>
        <span>
          <Users className="inline h-4 w-4 align-middle" /> Max: {drive.maxApplicants != null ? `${drive.maxApplicants} spots` : "Unlimited"}
        </span>
        <span>·</span>
        <span>
          <FileQuestion className="inline h-4 w-4 align-middle" /> {questionCount} questions
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{drive.description}</p>

      {(drive.requiredSkills || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {drive.requiredSkills.map((skill, i) => (
            <span
              key={i}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-900">{applicantCount}</span>
            <span className="text-slate-500">Total applicants</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-900">{shortlistedCount}</span>
            <span className="text-slate-500">Shortlisted</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-green-500" />
            <span className="font-semibold text-slate-900">{selectedCount}</span>
            <span className="text-slate-500">Selected</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Link
            to={`/leader/clubs/${clubId}/drives/${drive._id}/applications`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            View Applications →
          </Link>
          {status === "draft" && (
            <button
              type="button"
              onClick={() => setConfirmAction("publish")}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" /> Publish Drive
            </button>
          )}
          {status === "open" && (
            <button
              type="button"
              onClick={() => setConfirmAction("pause")}
              disabled={updating}
              className="rounded-lg px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              <Pause className="inline h-4 w-4" /> Pause
            </button>
          )}
          {status === "paused" && (
            <button
              type="button"
              onClick={() => setConfirmAction("resume")}
              disabled={updating}
              className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <Play className="inline h-4 w-4" /> Resume
            </button>
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setConfirmAction(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">
                {confirmAction === "pause" && "Pause this drive?"}
                {confirmAction === "resume" && "Resume this drive?"}
                {confirmAction === "close" && "Close this drive?"}
                {confirmAction === "delete" && "Delete this drive?"}
                {confirmAction === "publish" && "Publish this drive?"}
              </h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {confirmAction === "pause" && "Applicants won't see it until you resume."}
              {confirmAction === "resume" && "The drive will be visible to students again."}
              {confirmAction === "close" && "The drive will be closed. Pending applications can be rejected."}
              {confirmAction === "delete" && "This cannot be undone. All draft data will be lost."}
              {confirmAction === "publish" && "The drive will be visible and students can apply."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction === "pause") handleStatusChange("paused");
                  if (confirmAction === "resume") handleStatusChange("open");
                  if (confirmAction === "close") handleStatusChange("closed");
                  if (confirmAction === "delete") handleDelete();
                  if (confirmAction === "publish") handleStatusChange("open");
                }}
                disabled={updating}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderRecruitmentPage() {
  const { clubId: paramClubId } = useParams();
  const [club, setClub] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDrive, setEditDrive] = useState(null);

  // Use clubId from URL params if available, otherwise fetch from leader API
  const clubId = paramClubId || club?._id;

  const fetchClub = useCallback(async () => {
    try {
      // If we have a clubId from params, use the clubs API
      // Otherwise, use the leader API to get the coordinator's club
      const url = paramClubId ? `/api/clubs/${paramClubId}` : "/api/leader/club";
      const res = await api.get(url);
      if (res.data?.success) setClub(res.data.data);
      else setClub(null);
    } catch {
      setClub(null);
    }
  }, [paramClubId]);

  const fetchDrives = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/clubs/${clubId}/drives?status=all`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDrives(res.data.data);
      } else {
        setDrives([]);
      }
    } catch {
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const activeDrives = drives.filter((d) => d.status === "open").length;
  const totalApplications = drives.reduce((s, d) => s + (d.applicantCount || 0), 0);
  const totalShortlisted = drives.reduce((s, d) => s + (d.shortlistedCount || 0), 0);
  const totalSelected = drives.reduce((s, d) => s + (d.selectedCount || 0), 0);

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditDrive(null);
  };

  const handleCreateSuccess = () => {
    fetchDrives();
    handleCloseModal();
  };

  // Show loading while fetching club (when no clubId in URL)
  if (!paramClubId && !club && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F8FAFC]">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  // Show error if no club found
  if (!clubId && !club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F8FAFC]">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
          <p className="text-slate-700 font-medium">No club assigned</p>
          <p className="text-slate-500 text-sm mt-1">You need to be assigned as a Faculty Coordinator to manage recruitment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F8FAFC] px-4 py-6 md:px-6 md:py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recruitment Drives</h1>
            <p className="mt-1 text-sm text-slate-500">
              {club?.name || "Club"}
              <Link to={`/leader/clubs/${clubId}/team`} className="ml-3 text-blue-600 hover:underline font-medium">Manage team</Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditDrive(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" /> Create New Drive
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:flex md:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 pl-5" style={{ borderLeftWidth: "4px", borderLeftColor: "#22C55E" }}>
            <p className="text-4xl font-bold text-slate-900">{activeDrives}</p>
            <p className="text-sm text-slate-500">active drives</p>
            <p className="mt-1 text-xs text-green-600">↑ 2 from last month</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 pl-5" style={{ borderLeftWidth: "4px", borderLeftColor: "#2563EB" }}>
            <p className="text-4xl font-bold text-slate-900">{totalApplications}</p>
            <p className="text-sm text-slate-500">Total Applications</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{totalShortlisted}</p>
            <p className="text-xs font-medium text-slate-500">Shortlisted</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{totalSelected}</p>
            <p className="text-xs font-medium text-slate-500">Selected</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">Loading drives...</div>
        ) : drives.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <FileQuestion className="h-16 w-16 text-slate-200" />
            <p className="mt-4 text-lg font-semibold text-slate-700">No drives yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first recruitment drive to start accepting applications.</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create New Drive
            </button>
          </div>
        ) : (
          <div>
            {drives.map((drive) => (
              <DriveCard
                key={drive._id}
                drive={drive}
                clubId={clubId}
                onEdit={(d) => { setEditDrive(d); setModalOpen(true); }}
                onRefetch={fetchDrives}
              />
            ))}
          </div>
        )}
      </div>

      <CreateDriveModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
        clubId={clubId}
        initialDrive={editDrive}
      />
    </div>
  );
}
