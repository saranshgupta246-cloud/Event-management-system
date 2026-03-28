import React, { useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useStudentEventDetail from "../../hooks/useStudentEventDetail";
import useRegisterEvent from "../../hooks/useRegisterEvent";
import { PageTitle, BodyText } from "../../components/ui/Typography";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { eventRouteSegment, feeForRegistrationType } from "../../utils/eventRoutes";

function normalizeType(t) {
  if (t === "duo" || t === "squad") return t;
  return "solo";
}

export default function EventRegistration() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, loading: eventLoading } = useStudentEventDetail(eventId);
  const { register, loading: registering } = useRegisterEvent();
  const [termsChecked, setTermsChecked] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [error, setError] = useState("");
  const [teamName, setTeamName] = useState("");

  const registrationType = normalizeType(searchParams.get("type"));

  const teammateBounds = useMemo(() => {
    if (!event || registrationType !== "squad") return { min: 0, max: 0 };
    const tmin = Math.max(2, Number(event.teamSize?.min ?? 2));
    const tmax = Math.min(10, Math.max(tmin, Number(event.teamSize?.max ?? 5)));
    return { min: tmin - 1, max: tmax - 1 };
  }, [event, registrationType]);

  const [teammates, setTeammates] = useState([{ email: "", enrollmentId: "" }]);

  React.useEffect(() => {
    if (registrationType === "duo") {
      setTeammates([{ email: "", enrollmentId: "" }]);
    } else if (registrationType === "squad") {
      const n = Math.max(1, teammateBounds.min);
      setTeammates(Array.from({ length: n }, () => ({ email: "", enrollmentId: "" })));
    } else {
      setTeammates([{ email: "", enrollmentId: "" }]);
    }
  }, [registrationType, teammateBounds.min]);

  if (eventLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full flex items-center justify-center py-24">
        <span className="material-symbols-outlined text-5xl text-slate-300 animate-pulse">
          hourglass_empty
        </span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-24">
        <p className="text-slate-500">Event not found.</p>
        <Link
          to="/student/events"
          className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const enabled = event.registrationTypes?.length ? event.registrationTypes : ["solo"];
  if (!enabled.includes(registrationType)) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-24">
        <p className="text-slate-500">This registration type is not available.</p>
        <Link
          to={`/student/events/${eventRouteSegment(event) || eventId}`}
          className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
        >
          Back to event
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
  const isFull = (event.availableSeats ?? 0) <= 0;
  const feeAmount = feeForRegistrationType(event, registrationType);
  const isPaid = feeAmount > 0;
  const feeLabel = feeAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  const setTeammateRow = (idx, field, value) => {
    setTeammates((rows) => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addSquadRow = () => {
    if (registrationType !== "squad") return;
    if (teammates.length >= teammateBounds.max) return;
    setTeammates((rows) => [...rows, { email: "", enrollmentId: "" }]);
  };

  const removeSquadRow = () => {
    if (registrationType !== "squad" || teammates.length <= teammateBounds.min) return;
    setTeammates((rows) => rows.slice(0, -1));
  };

  const handleConfirm = async () => {
    setError("");
    if (!termsChecked) {
      setError("Please confirm your details are correct.");
      return;
    }
    if (isFull) {
      setError("This event is full. Registration is closed.");
      return;
    }
    if (registrationType !== "solo" && !teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    let teammatePayload = [];
    if (registrationType === "duo") {
      const row = teammates[0] || {};
      if (!row.email?.trim() && !row.enrollmentId?.trim()) {
        setError("Enter your teammate's email or enrollment ID.");
        return;
      }
      teammatePayload = [{ email: row.email?.trim(), enrollmentId: row.enrollmentId?.trim() }];
    } else if (registrationType === "squad") {
      if (teammates.length < teammateBounds.min || teammates.length > teammateBounds.max) {
        setError(
          `Add between ${teammateBounds.min} and ${teammateBounds.max} teammates.`
        );
        return;
      }
      for (const row of teammates) {
        if (!row.email?.trim() && !row.enrollmentId?.trim()) {
          setError("Each teammate needs an email or enrollment ID.");
          return;
        }
      }
      teammatePayload = teammates.map((row) => ({
        email: row.email?.trim(),
        enrollmentId: row.enrollmentId?.trim(),
      }));
    }
    if (isPaid && !/^\d{12}$/.test(utrNumber.trim())) {
      setError("Enter a valid 12-digit UTR number.");
      return;
    }
    const segment = eventRouteSegment(event) || eventId;
    const result = await register(segment, {
      registrationType,
      teamName: registrationType === "solo" ? undefined : teamName.trim(),
      teammates: registrationType === "solo" ? undefined : teammatePayload,
      utrNumber: isPaid ? utrNumber.trim() : undefined,
    });
    if (result.success) {
      navigate(`/student/events/${segment}/success`, {
        replace: true,
        state: {
          event: {
            title: event.title,
            eventDate: event.eventDate,
            location: event.location,
          },
          registration: result.data,
          payment: {
            isPaid,
            registrationFee: feeAmount,
            utrNumber: isPaid ? utrNumber.trim() : "",
          },
        },
      });
    } else {
      setError(result.message || "Registration failed. Please try again.");
    }
  };

  const typeTitle =
    registrationType === "solo" ? "Solo" : registrationType === "duo" ? "Duo" : "Squad";

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full">
      <nav className="flex items-center gap-1 text-sm text-slate-500 mb-6">
        <Link to="/student" className="hover:text-primary-600">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link to="/student/events" className="hover:text-primary-600">
          Events
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link
          to={`/student/events/${eventRouteSegment(event) || eventId}`}
          className="hover:text-primary-600 truncate"
        >
          {event.title}
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Confirm</span>
      </nav>

      <PageTitle className="mb-1">Register — {typeTitle}</PageTitle>
      <BodyText className="mb-6">
        {isPaid
          ? "Complete payment, enter your UTR, and confirm your registration."
          : "Review the details and confirm your attendance."}
      </BodyText>

      <div className="bg-white dark:bg-[#161f2e] rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{event.title}</h2>
            {event.clubName && (
              <p className="text-primary-600 font-medium text-sm mt-1">
                Hosted by {event.clubName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 py-4 border-y border-slate-100 dark:border-[#1e2d42]">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-slate-400">calendar_today</span>
              {displayDate} {timeRange && `| ${timeRange}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-slate-400">location_on</span>
                {event.location}
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-[#161f2e] rounded-[14px] p-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              You are registering as <strong>{user?.name}</strong>
              {user?.studentId ? ` (SID: ${user.studentId})` : ""}.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {registrationType !== "solo" && "Team leader pays for the full team. "}
              {isPaid ? `Fee: ${feeLabel}` : "Free registration."}
            </p>
          </div>

          {registrationType !== "solo" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Team name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                placeholder="Your team name"
              />
            </div>
          )}

          {registrationType === "duo" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teammate (1) — email or enrollment ID
              </p>
              <input
                type="text"
                value={teammates[0]?.email || ""}
                onChange={(e) => setTeammateRow(0, "email", e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white mb-2"
              />
              <input
                type="text"
                value={teammates[0]?.enrollmentId || ""}
                onChange={(e) => setTeammateRow(0, "enrollmentId", e.target.value)}
                placeholder="Enrollment ID"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
              />
            </div>
          )}

          {registrationType === "squad" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teammates ({teammateBounds.min}–{teammateBounds.max} people)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSquadRow}
                    disabled={teammates.length >= teammateBounds.max}
                    className="text-xs font-semibold text-primary-600 disabled:opacity-40"
                  >
                    Add row
                  </button>
                  <button
                    type="button"
                    onClick={removeSquadRow}
                    disabled={teammates.length <= teammateBounds.min}
                    className="text-xs font-semibold text-slate-500 disabled:opacity-40"
                  >
                    Remove last
                  </button>
                </div>
              </div>
              {teammates.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#1e2d42] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500">Teammate {idx + 1}</p>
                  <input
                    type="text"
                    value={row.email || ""}
                    onChange={(e) => setTeammateRow(idx, "email", e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                  />
                  <input
                    type="text"
                    value={row.enrollmentId || ""}
                    onChange={(e) => setTeammateRow(idx, "enrollmentId", e.target.value)}
                    placeholder="Enrollment ID"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}

          {isPaid && (
            <div className="rounded-[14px] border border-amber-200 bg-amber-50/80 dark:border-amber-700/40 dark:bg-amber-900/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Paid registration: {feeLabel}
                {registrationType !== "solo" && " (full team)"}
              </p>
              {event.upiId && (
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Pay via UPI ID: <span className="font-semibold">{event.upiId}</span>
                </p>
              )}
              {event.upiQrImageUrl && (
                <div className="flex justify-center">
                  <img
                    src={resolveEventImageUrl(event.upiQrImageUrl)}
                    alt="UPI QR"
                    className="h-36 w-36 object-contain rounded-lg border border-slate-200 dark:border-[#1e2d42] bg-white"
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor={eventId ? `event-registration-utr-${eventId}` : "event-registration-utr"}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  UTR Number (12 digits) *
                </label>
                <input
                  id={eventId ? `event-registration-utr-${eventId}` : "event-registration-utr"}
                  name={eventId ? `event-registration-utr-${eventId}` : "event-registration-utr"}
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Enter UTR after payment"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-white"
                />
              </div>
            </div>
          )}

          <label htmlFor={eventId ? `event-registration-terms-${eventId}` : "event-registration-terms"} className="flex items-start gap-3 cursor-pointer">
            <input
              id={eventId ? `event-registration-terms-${eventId}` : "event-registration-terms"}
              name={eventId ? `event-registration-terms-${eventId}` : "event-registration-terms"}
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              I confirm my details are correct and I agree to attend this event.
            </span>
          </label>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={registering || isFull}
              className="flex-1 py-3 rounded-[14px] font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {registering ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Confirming...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">how_to_reg</span>
                  {isPaid ? "Submit UTR & Register" : "Confirm Registration"}
                </>
              )}
            </button>
            <Link
              to={`/student/events/${eventRouteSegment(event) || eventId}`}
              className="sm:w-auto py-3 px-6 rounded-[14px] font-semibold bg-slate-100 dark:bg-[#161f2e] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
