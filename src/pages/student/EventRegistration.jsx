import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useStudentEventDetail from "../../hooks/useStudentEventDetail";
import useRegisterEvent from "../../hooks/useRegisterEvent";
import { PageTitle, BodyText } from "../../components/ui/Typography";

export default function EventRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, loading: eventLoading } = useStudentEventDetail(eventId);
  const { register, loading: registering } = useRegisterEvent();
  const [termsChecked, setTermsChecked] = useState(false);
  const [error, setError] = useState("");

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
    const result = await register(eventId);
    if (result.success) {
      navigate(`/student/events/${eventId}/success`, {
        replace: true,
        state: {
          event: {
            title: event.title,
            eventDate: event.eventDate,
            location: event.location,
          },
          registration: result.data,
        },
      });
    } else {
      setError(result.message || "Registration failed. Please try again.");
    }
  };

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
          to={`/student/events/${eventId}`}
          className="hover:text-primary-600 truncate"
        >
          {event.title}
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Confirm</span>
      </nav>

      <PageTitle className="mb-1">Final Step: Registration</PageTitle>
      <BodyText className="mb-6">
        Review the details and confirm your attendance.
      </BodyText>

      <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{event.title}</h2>
            {event.clubName && (
              <p className="text-primary-600 font-medium text-sm mt-1">
                Hosted by {event.clubName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 py-4 border-y border-slate-100 dark:border-slate-800">
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
          <div className="bg-slate-50 dark:bg-slate-800 rounded-[14px] p-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              You are registering as <strong>{user?.name}</strong>
              {user?.studentId ? ` (SID: ${user.studentId})` : ""}.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
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
                  Confirm Registration
                </>
              )}
            </button>
            <Link
              to={`/student/events/${eventId}`}
              className="sm:w-auto py-3 px-6 rounded-[14px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
