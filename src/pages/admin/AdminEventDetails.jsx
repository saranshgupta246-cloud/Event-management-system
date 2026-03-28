import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { getAdminEvent } from "../../hooks/useAdminEvents";
import { eventRouteSegment, isMongoObjectIdString } from "../../utils/eventRoutes";

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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Manage</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/admin/events/${segment}/participants`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
                >
                  View Participants
                </Link>
                <Link
                  to={`/admin/events/${segment}/certificates`}
                  state={{ eventTitle: event?.title }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Certificates
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
