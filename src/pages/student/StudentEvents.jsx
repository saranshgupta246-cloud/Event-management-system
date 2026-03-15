import React, { useState } from "react";
import { Link } from "react-router-dom";
import useStudentEvents from "../../hooks/useStudentEvents";
import { PageTitle, BodyText } from "../../components/ui/Typography";

function EventStatusBadge({ event, seatsLeft }) {
  const effectiveSeatsLeft =
    typeof seatsLeft === "number"
      ? seatsLeft
      : typeof event?.availableSeats === "number"
      ? Math.max(0, event.availableSeats)
      : null;

  if (event.isRegistered) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
        Registered
      </span>
    );
  }
  const registrationOpen = event.isRegistrationOpen ?? true;

  if (event.status === "cancelled" || effectiveSeatsLeft === 0 || !registrationOpen) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-600">
      Open
    </span>
  );
}

export default function StudentEvents() {
  const [search, setSearch] = useState("");
  const { items: events, loading, error } = useStudentEvents({ search });

  const displayDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <PageTitle className="mb-1">All Events</PageTitle>
      <BodyText className="mb-6">
        Browse and register for upcoming campus events, workshops, and meetings.
      </BodyText>

      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-[14px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
            hourglass_empty
          </span>
          <p className="text-slate-500 text-sm">Loading events...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-[18px] border border-red-200 dark:border-red-800 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
            event_busy
          </span>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No events found</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {search.trim() ? "Try a different search." : "No events at the moment."}
          </p>
          {search.trim() && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-primary-600 font-semibold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const totalSeats = typeof event.totalSeats === "number" ? event.totalSeats : 0;
            const hasLimitedSeats = totalSeats > 0;
            const rawSeatsLeft =
              typeof event.seatsLeft === "number"
                ? event.seatsLeft
                : typeof event.availableSeats === "number"
                ? event.availableSeats
                : null;
            const seatsLeft =
              typeof rawSeatsLeft === "number" ? Math.max(0, rawSeatsLeft) : null;

            return (
              <Link
                key={event._id}
                to={`/student/events/${event._id}`}
                className="group block bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                  {event.imageUrl ? (
                    <>
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-700/20" />
                  )}
                  <div className="absolute top-2 right-2">
                    <EventStatusBadge event={event} seatsLeft={seatsLeft} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-white text-xs font-medium drop-shadow">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {displayDate(event.eventDate)}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                    {event.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {event.clubName}
                  </p>
                  {hasLimitedSeats && seatsLeft !== null && (
                    <p className="text-xs text-slate-400 mt-1">
                      {seatsLeft === 0 ? "No seats left" : `${seatsLeft} seats left`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
