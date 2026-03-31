import React, { useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import useStudentEventDetail from "../../hooks/useStudentEventDetail";
import { PageTitle, SectionTitle, BodyText } from "../../components/ui/Typography";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { eventRouteSegment, isMongoObjectIdString, feeForRegistrationType } from "../../utils/eventRoutes";
import EventNotFound from "./EventNotFound.jsx";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { event, loading, error } = useStudentEventDetail(eventId);

  useEffect(() => {
    if (!event?._id || !eventId) return;
    if (!isMongoObjectIdString(eventId)) return;
    if (String(event._id) !== eventId) return;
    const slug = event.slug?.trim();
    if (!slug || slug === eventId) return;
    const rest = location.pathname.replace(`/student/events/${eventId}`, "") || "";
    navigate(`/student/events/${slug}${rest}`, { replace: true });
  }, [event, eventId, location.pathname, navigate]);

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
    return <EventNotFound />;
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
  const regTypes = event.registrationTypes?.length ? event.registrationTypes : ["solo"];
  const anyPaidType = regTypes.some((t) => feeForRegistrationType(event, t) > 0);
  const minSquadSize = Math.max(2, Number(event.teamSize?.min ?? 2));
  const availableSeats = Number(event.availableSeats ?? 0);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <nav className="flex items-center gap-1 text-sm text-slate-500 mb-6">
        <Link to="/student" className="hover:text-primary-600">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link to="/student/events" className="hover:text-primary-600">
          Events
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{event.title}</span>
      </nav>

      {event.imageUrl && (
        <div className="mb-6 rounded-[18px] overflow-hidden border border-slate-200 dark:border-[#1e2d42] bg-slate-100 dark:bg-[#161f2e]">
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#1a1020]">
            <img
              src={resolveEventImageUrl(event.imageUrl)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 z-0 w-full h-full object-cover scale-[1.1] [filter:blur(18px)_brightness(0.45)_saturate(1.4)]"
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
            <img
              src={resolveEventImageUrl(event.imageUrl)}
              alt={event.title}
              className="absolute top-1/2 left-1/2 z-20 h-full w-auto max-w-[45%] -translate-x-1/2 -translate-y-1/2 object-contain object-center"
            />
            <div className="absolute bottom-3 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 text-white text-xs sm:text-sm">
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

      <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm p-6 mb-6">
        <PageTitle>{event.title}</PageTitle>
        {event.clubName && (
          <BodyText className="mt-1 text-primary-600">
            Hosted by {event.clubName}
          </BodyText>
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
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">payments</span>
            {anyPaidType ? "Paid & free options" : "Free"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {event.description && (
            <section className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm p-6">
              <SectionTitle className="mb-4">Description</SectionTitle>
              <BodyText className="leading-relaxed whitespace-pre-wrap">
                {event.description}
              </BodyText>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-lg p-6 space-y-5">
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
                <div className="mt-2 h-2 bg-slate-100 dark:bg-[#161f2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{ width: `${seatPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-[#1e2d42] space-y-4">
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
              {anyPaidType && (
                <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 p-2.5 text-amber-800 dark:text-amber-300">
                  Some registration options require UPI payment and a 12-digit UTR.
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
                    className="block w-full py-3 rounded-[14px] font-semibold text-center bg-slate-100 dark:bg-[#161f2e] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Choose registration
                  </p>
                  <div className="grid gap-2">
                    {regTypes.map((t) => {
                      const fee = feeForRegistrationType(event, t);
                      const label =
                        t === "solo" ? "Solo" : t === "duo" ? "Duo (2)" : "Squad";
                      const sub =
                        t !== "solo" ? "Leader pays for full team" : "Register alone";
                      const requiredSeats = t === "duo" ? 2 : t === "squad" ? minSquadSize : 1;
                      const insufficientSeats = availableSeats < requiredSeats;
                      const price =
                        fee <= 0
                          ? "Free"
                          : `${fee.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            })} / team`;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={insufficientSeats}
                          onClick={() =>
                            navigate(
                              `/student/events/${eventRouteSegment(event) || eventId}/register?type=${t}`
                            )
                          }
                          className="w-full text-left rounded-[14px] border border-slate-200 dark:border-[#1e2d42] bg-slate-50 dark:bg-[#161f2e] px-4 py-3 hover:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
                          <p className="text-sm font-bold text-primary-600 mt-1">{price}</p>
                          {requiredSeats > 1 && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Needs {requiredSeats} seats · Available {Math.max(0, availableSeats)}
                            </p>
                          )}
                          {insufficientSeats && (
                            <p className="text-[11px] text-rose-600 mt-1">
                              Not enough seats for this team size
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
