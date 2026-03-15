import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useMyRegistrations from "../../hooks/useMyRegistrations";
import { PageTitle, BodyText } from "../../components/ui/Typography";

export default function MyRegistrations() {
  const { items, loading, error } = useMyRegistrations();
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <PageTitle className="mb-1">My Registrations</PageTitle>
      <BodyText className="mb-6">
        Events you have registered for. Show your pass at the venue.
      </BodyText>

      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 p-8 text-center">
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

      {!loading && !error && items.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 p-12 text-center">
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

          return (
            <li key={reg._id}>
              <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
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
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0">
                    {event._id && (
                      <Link
                        to={`/student/events/${event._id}`}
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
