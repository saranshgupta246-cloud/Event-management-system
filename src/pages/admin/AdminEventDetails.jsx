import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { getAdminEvent, updateAdminEvent } from "../../hooks/useAdminEvents";
import { eventRouteSegment, isMongoObjectIdString } from "../../utils/eventRoutes";
import { getApprovalMeta, getApprovalStatus, isEventApproved } from "../../utils/eventApproval";
import { useEventFeedbackSummary } from "../../hooks/useEventFeedback";
import EventFeedbackSummaryCard from "../../components/feedback/EventFeedbackSummaryCard";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminEventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalSaving, setApprovalSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await getAdminEvent(eventId);
      if (!mounted) return;
      if (res?.success) {
        setEvent(res.data);
        setError("");
      } else {
        setError(res?.message || "Failed to load event details.");
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!event?._id || !eventId) return;
    if (!isMongoObjectIdString(eventId)) return;
    if (String(event._id) !== eventId) return;
    const slug = event.slug?.trim();
    if (!slug || slug === eventId) return;
    const rest = location.pathname.replace(`/admin/events/${eventId}`, "") || "";
    navigate(`/admin/events/${slug}${rest}`, { replace: true });
  }, [event, eventId, location.pathname, navigate]);

  const segment = event ? eventRouteSegment(event) || eventId : eventId;
  const approvalMeta = getApprovalMeta(event);
  const { summary, loading: feedbackLoading } = useEventFeedbackSummary(event?._id, !!event?._id);

  const handleApprovalChange = async (approvalStatus) => {
    if (!event?._id) return;
    setApprovalSaving(true);
    const res = await updateAdminEvent(event._id, {
      approvalStatus,
      ...(approvalStatus === "approved" ? { status: event.status || "upcoming" } : {}),
    });
    setApprovalSaving(false);
    if (res?.success) {
      const refreshed = await getAdminEvent(event._id);
      if (refreshed?.success) {
        setEvent(refreshed.data);
      }
    } else {
      setError(res?.message || "Failed to update approval.");
    }
  };

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate("/admin/events")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </button>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-400">
            Loading event details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event?.title}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {event?.description || "No description"}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event?.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event?.location || "No location"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {event?.totalRegistrations ?? 0} registered
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${approvalMeta.className}`}>
                  {approvalMeta.label}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Manage</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {getApprovalStatus(event) === "pending_approval" && (
                  <>
                    <button
                      type="button"
                      disabled={approvalSaving}
                      onClick={() => handleApprovalChange("approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Approve Event
                    </button>
                    <button
                      type="button"
                      disabled={approvalSaving}
                      onClick={() => handleApprovalChange("rejected")}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/20"
                    >
                      Reject Event
                    </button>
                  </>
                )}
                <Link
                  to={`/admin/events/${segment}/participants`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
                >
                  View Participants
                </Link>
                <Link
                  to={`/admin/events/${segment}/certificates`}
                  state={{ eventTitle: event?.title }}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                    isEventApproved(event)
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:text-slate-200 dark:hover:bg-slate-800"
                      : "pointer-events-none border-slate-200 text-slate-400 dark:border-[#1e2d42] dark:text-slate-500"
                  }`}
                >
                  Certificates
                </Link>
              </div>
            </div>

            <EventFeedbackSummaryCard
              title="Attendee Feedback"
              summary={summary}
              loading={feedbackLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
