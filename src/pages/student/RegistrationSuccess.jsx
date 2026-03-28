import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";
import useStudentEventDetail from "../../hooks/useStudentEventDetail";
import { PageTitle, BodyText } from "../../components/ui/Typography";

export default function RegistrationSuccess() {
  const { eventId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [animate, setAnimate] = useState(false);

  const hasState = state?.event && state?.registration;
  const { event: fetchedEvent, loading } = useStudentEventDetail(
    hasState ? null : eventId
  );

  const event = hasState ? state.event : fetchedEvent;
  const registration = hasState ? state.registration : fetchedEvent?.myRegistration;
  const paymentFromState = state?.payment;
  const isPaid =
    typeof paymentFromState?.isPaid === "boolean"
      ? paymentFromState.isPaid
      : Number(registration?.amountPaid || 0) > 0;
  const feeValue =
    paymentFromState?.registrationFee ?? Number(registration?.amountPaid || 0);
  const feeLabel =
    Number(feeValue || 0) > 0
      ? Number(feeValue).toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        })
      : null;
  const resolvedUtr =
    paymentFromState?.utrNumber || registration?.utrNumber || "Not provided";

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!hasState && loading) {
    return (
      <div className="p-6 max-w-xl mx-auto flex items-center justify-center py-24">
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

  return (
    <div className="p-6 sm:p-8 max-w-xl mx-auto">
      <div
        className={`bg-white dark:bg-[#161f2e] rounded-[18px] shadow-lg border border-slate-200 dark:border-[#1e2d42] p-8 sm:p-10 text-center transition-all duration-500 ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <span
            className="material-symbols-outlined text-5xl text-emerald-600"
            style={{ fontVariationSettings: "'wght' 600" }}
          >
            check_circle
          </span>
        </div>
        <PageTitle className="mb-2">Registration Successful!</PageTitle>
        <BodyText className="mb-6">
          You&apos;re all set, {user?.name?.split(" ")[0] ?? "Student"}! Show the QR code below
          at the venue for check-in.
        </BodyText>

        {isPaid && (
          <div className="mb-6 rounded-[14px] border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-left">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Payment marked successful{feeLabel ? ` (${feeLabel})` : ""}.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              UTR: <span className="font-semibold">{resolvedUtr}</span>
            </p>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-[#161f2e] rounded-[14px] p-4 text-left mb-6">
          <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {displayDate}
            {event.location ? ` • ${event.location}` : ""}
          </p>
          {user?.name && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user.name}
              {user.studentId ? ` (SID: ${user.studentId})` : ""}
            </p>
          )}
        </div>

        <div className="flex justify-center mb-6">
          {registration?.qrCodeToken ? (
            <div className="flex flex-col items-center gap-2">
              <QRCodeCanvas
                value={registration.qrCodeToken}
                size={128}
                bgColor="#ffffff"
                fgColor="#0d1117"
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                Check-in QR
              </span>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-[14px] bg-slate-100 dark:bg-[#161f2e] border-2 border-dashed border-slate-300 dark:border-[#2d3f55] flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-slate-400">
                qr_code_2
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/student/my-registrations"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] font-semibold bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-all"
          >
            <span className="material-symbols-outlined">event_available</span>
            View My Registrations
          </Link>
          <Link
            to="/student"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] font-semibold bg-slate-100 dark:bg-[#161f2e] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <span className="material-symbols-outlined">dashboard</span>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
