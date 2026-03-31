import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useMyRegistrations from "../../hooks/useMyRegistrations";
import { PageTitle, BodyText } from "../../components/ui/Typography";
import { eventRouteSegment } from "../../utils/eventRoutes";
import { useMyEventFeedback } from "../../hooks/useEventFeedback";
import { canSubmitEventFeedback } from "../../utils/eventFeedback";
import EventFeedbackModal from "../../components/feedback/EventFeedbackModal";
import { canCancelStudentRegistration, getStudentEventDisplayStatus } from "../../utils/studentEventStatus";

function RegistrationFeedbackActions({ registration, onSaved }) {
  const event = registration?.event || {};
  const canFeedback = canSubmitEventFeedback(registration);
  const [open, setOpen] = useState(false);
  const { feedback, refetch } = useMyEventFeedback(event._id, canFeedback && !!event._id);

  if (!event._id || !canFeedback) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 sm:mt-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
      >
        <span className="material-symbols-outlined text-sm">reviews</span>
        {feedback?._id ? "Edit feedback" : "Give feedback"}
      </button>
      <EventFeedbackModal
        open={open}
        onClose={() => setOpen(false)}
        event={event}
        feedback={feedback}
        onSaved={async () => {
          await refetch();
          onSaved?.();
        }}
      />
    </>
  );
}

export default function MyRegistrations() {
  const { items, loading, error, refetch, cancelRegistration } = useMyRegistrations();
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleCancel = useCallback(
    async (reg) => {
      if (!reg?._id || !canCancelStudentRegistration(reg)) return;
      const ok = window.confirm(
        "Cancel this registration? You may need to register again if you change your mind."
      );
      if (!ok) return;
      setActionError(null);
      setCancellingId(reg._id);
      try {
        const data = await cancelRegistration(reg._id);
        if (!data?.success) {
          setActionError(data?.message || "Could not cancel registration.");
          return;
        }
        await refetch();
      } catch (err) {
        setActionError(
          err.response?.data?.message ||
            err.message ||
            "Could not cancel registration."
        );
      } finally {
        setCancellingId(null);
      }
    },
    [cancelRegistration, refetch]
  );

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <PageTitle className="mb-1">My Registrations</PageTitle>
      <BodyText className="mb-6">
        Events you have registered for. Show your pass at the venue.
      </BodyText>

      {loading && (
        <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2 animate-pulse">
            hourglass_empty
          </span>
          <p className="text-sm text-slate-500">Loading your registrations...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-[18px] border border-red-200 dark:border-red-800 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
          {actionError}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
            event_busy
          </span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No registrations yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Browse events and register to see them here.
          </p>
          <Link
            to="/student/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all"
          >
            <span className="material-symbols-outlined">search</span>
            Browse Events
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-4">
          {items.map((reg) => {
            const event = reg.event || {};
            const displayDate = event.eventDate
              ? new Date(event.eventDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "";
            const isPaid = Number(reg.amountPaid || 0) > 0;
            const paymentStatusLabel =
              reg.paymentStatus === "revoked"
                ? "Payment revoked"
                : reg.paymentStatus === "confirmed"
                ? "Payment confirmed"
                : "Payment pending";
            const paymentStatusCls =
              reg.paymentStatus === "revoked"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : reg.paymentStatus === "confirmed"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
            const eventStatus = getStudentEventDisplayStatus({ event, registration: reg });
            const statusCls =
              eventStatus.key === "completed"
                ? "bg-slate-100 text-slate-700 dark:bg-[#1e2d42] dark:text-slate-300"
                : eventStatus.key === "locked"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                : eventStatus.key === "cancelled"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : reg.status === "revoked"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

          return (
            <li key={reg._id}>
              <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      {event.title || "Event"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {displayDate}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Registered{" "}
                      {reg.registeredAt
                        ? new Date(reg.registeredAt).toLocaleDateString("en-IN")
                        : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCls}`}
                      >
                        {reg.status === "revoked" ? "Revoked" : eventStatus.label}
                      </span>
                      {isPaid && (
                        <>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusCls}`}
                          >
                            {paymentStatusLabel}
                          </span>
                          {reg.utrNumber && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              UTR: {reg.utrNumber}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0">
                    {event._id && (
                      <Link
                        to={`/student/events/${eventRouteSegment(event)}`}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View details
                      </Link>
                    )}
                    {event._id && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/student/chat?eventId=${encodeURIComponent(event._id)}`)
                        }
                        className="mt-1 sm:mt-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <span className="material-symbols-outlined text-sm">forum</span>
                        Open chat
                      </button>
                    )}
                    {canCancelStudentRegistration(reg) && (
                      <button
                        type="button"
                        disabled={cancellingId === reg._id}
                        onClick={() => handleCancel(reg)}
                        className="mt-1 sm:mt-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        {cancellingId === reg._id ? "Cancelling…" : "Cancel registration"}
                      </button>
                    )}
                    <RegistrationFeedbackActions registration={reg} onSaved={refetch} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        </ul>
      )}
    </div>
  );
}
