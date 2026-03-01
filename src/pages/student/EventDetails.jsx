import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useStudentEventDetail from "../../hooks/useStudentEventDetail";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { event, loading, error } = useStudentEventDetail(eventId);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-5xl text-slate-300 animate-pulse">
            hourglass_empty
          </span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full text-center py-24">
        <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">
          event_busy
        </span>
        <p className="text-slate-500 font-medium">{error || "Event not found."}</p>
        <Link
          to="/student/events"
          className="mt-4 inline-flex items-center gap-1 text-[#2563eb] font-semibold hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Events
        </Link>
      </div>
    );
  }

  const displayDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const timeRange =
    event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "";
  const seatsFilled = (event.totalSeats || 0) - (event.availableSeats ?? 0);
  const seatsTotal = event.totalSeats || 0;
  const seatPercent = seatsTotal > 0 ? Math.round((seatsFilled / seatsTotal) * 100) : 0;
  const isClosed =
    event.status === "completed" || event.status === "cancelled" || (event.availableSeats ?? 0) <= 0;

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const registrationOpensLabel = formatDateTime(event.registrationStart);
  const registrationClosesLabel = formatDateTime(event.registrationEnd);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <nav className="flex items-center gap-1 text-sm text-slate-500 mb-6">
        <Link to="/student" className="hover:text-[#2563eb]">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link to="/student/events" className="hover:text-[#2563eb]">
          Events
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{event.title}</span>
      </nav>

      {event.imageUrl && (
        <div className="mb-6 rounded-[18px] overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <div className="relative w-full aspect-[16/9]">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-white text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base sm:text-lg">calendar_today</span>
                <span>{displayDate}</span>
              </div>
              {timeRange && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base sm:text-lg">schedule</span>
                  <span>{timeRange}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {event.title}
        </h1>
        {event.clubName && (
          <p className="text-[#2563eb] font-medium mt-1">Hosted by {event.clubName}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            {displayDate}
          </span>
          {timeRange && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">schedule</span>
              {timeRange}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">location_on</span>
              {event.location}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {event.description && (
            <section className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Description</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</p>
              <p className="font-semibold text-slate-900 dark:text-white">{displayDate}</p>
            </div>
            {event.location && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Location
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">{event.location}</p>
              </div>
            )}
            {seatsTotal > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Seats
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {seatsFilled} / {seatsTotal} filled
                </p>
                <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563eb] rounded-full transition-all"
                    style={{ width: `${seatPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              {registrationOpensLabel && registrationClosesLabel && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    Registration window
                  </p>
                  <p>
                    Opens: {registrationOpensLabel}
                    <br />
                    Closes: {registrationClosesLabel}
                  </p>
                </div>
              )}

              {event.isRegistered ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    You are registered
                  </p>
                  <Link
                    to="/student/my-registrations"
                    className="block w-full py-3 rounded-[14px] font-semibold text-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    View My Registrations
                  </Link>
                </div>
              ) : isClosed || !event.isRegistrationOpen ? (
                <p className="text-sm text-slate-500 font-medium">
                  {event.registrationStart && new Date() < new Date(event.registrationStart)
                    ? "Registration has not opened yet."
                    : "Registration is closed."}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/student/events/${eventId}/register`)}
                  className="w-full py-3 rounded-[14px] font-semibold bg-[#2563eb] text-white shadow-md hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
