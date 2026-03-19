import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import useMyRegistrations from "../../hooks/useMyRegistrations";
import useStudentEvents from "../../hooks/useStudentEvents";
import Button from "../../components/ui/Button";

const getGreetingForIST = () => {
  try {
    const hourString = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(hourString, 10);
    if (Number.isNaN(hour)) return "Good Morning";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  } catch {
    return "Good Morning";
  }
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    icon: "check_circle",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    icon: "schedule",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: "cancel",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
  },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { getNotificationsForUser } = useNotifications();
  const { items: myRegs, loading: regsLoading } = useMyRegistrations();
  const [activeTab, setActiveTab] = useState("upcoming");
  const {
    items: events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useStudentEvents();

  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "recommended", label: "Recommended" },
    { id: "workshops", label: "Workshops" },
  ];

  const activeTabLabel =
    tabs.find((t) => t.id === activeTab)?.label ?? "Events";

  const greeting = getGreetingForIST();
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const notifs = getNotificationsForUser("student").slice(0, 10);

  const activityFeed = useMemo(() => {
    const notifItems = notifs.map((n) => ({
      id: `notif-${n.id}`,
      type: "notification",
      title: n.title,
      subtitle: n.message,
      timestamp: n.createdAt,
      icon: "campaign",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    }));

    const regItems = myRegs.slice(0, 8).map((r) => ({
      id: `reg-${r._id}`,
      type: "registration",
      title: r.event?.title ?? "Event",
      subtitle: `You registered for this event · ${r.event?.clubName ?? ""}`,
      timestamp: r.createdAt,
      icon: "event_available",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      status: r.status,
      eventId: r.event?._id,
    }));

    return [...notifItems, ...regItems]
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10);
  }, [notifs, myRegs]);

  const {
    upcomingEvents,
    recommendedEvents,
    workshopEvents,
  } = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];

    const now = new Date();
    const upcoming = safeEvents.filter((event) => {
      if (event?.status !== "upcoming") return false;
      if ((event?.availableSeats ?? 0) <= 0) return false;
      
      // Hide events where registration has ENDED (past the deadline)
      if (event?.registrationEnd) {
        const regEnd = new Date(event.registrationEnd);
        if (!Number.isNaN(regEnd.getTime()) && regEnd < now) {
          return false;
        }
      }
      return true;
    });

    const recommended = upcoming.filter((event) => !event?.isRegistered);

    const workshops = safeEvents.filter((event) => {
      const title = (event?.title ?? "").toLowerCase();
      const desc = (event?.description ?? "").toLowerCase();
      return title.includes("workshop") || desc.includes("workshop");
    });

    return {
      upcomingEvents: upcoming,
      recommendedEvents: recommended,
      workshopEvents: workshops,
    };
  }, [events]);

  const currentEvents = useMemo(() => {
    if (activeTab === "recommended") return recommendedEvents;
    if (activeTab === "workshops") return workshopEvents;
    return upcomingEvents;
  }, [activeTab, upcomingEvents, recommendedEvents, workshopEvents]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Gradient hero strip */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-700 px-4 sm:px-8 pt-8 pb-14">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-white tracking-tight text-2xl sm:text-[34px] font-bold leading-tight">
            {firstName} 👋
          </h1>
          <p className="text-blue-200 mt-1.5 text-sm">
            Here&apos;s what&apos;s happening on your campus today.
          </p>
        </div>
      </div>

      {/* Content area — overlaps hero slightly, single main column */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-8 -mt-6 pb-12">
        <div className="space-y-5">
          {/* Events section with tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-600">
                  event
                </span>
                Events for you
              </h2>
              <Link
                to="/student/events"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="px-5 pt-4 pb-5">
              <div className="inline-flex items-center p-0.5 rounded-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
                        isActive
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                {eventsLoading && (
                  <div className="py-10 flex flex-col items-center gap-2 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700">
                      hourglass_empty
                    </span>
                    <span>Loading events...</span>
                  </div>
                )}

                {eventsError && !eventsLoading && (
                  <div className="py-8 px-4 rounded-[16px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center space-y-3">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {eventsError}
                    </p>
                    {typeof eventsError === "string" &&
                      eventsError.toLowerCase().includes("too many requests") && (
                        <p className="text-[11px] text-red-500/80 dark:text-red-300/80">
                          This is temporary. Please wait a few seconds and then try again.
                        </p>
                      )}
                    <button
                      type="button"
                      onClick={refetchEvents}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 dark:border-red-700 px-4 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!eventsLoading &&
                  !eventsError &&
                  currentEvents.length === 0 && (
                    <div className="py-10 flex flex-col items-center gap-2 text-center text-slate-500 dark:text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700">
                        event_busy
                      </span>
                      <span>
                        No {activeTabLabel.toLowerCase()} events right now.
                      </span>
                    </div>
                  )}

                {!eventsLoading &&
                  !eventsError &&
                  currentEvents.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentEvents.map((event) => (
                        <Link
                          key={event._id}
                          to={`/student/events/${event._id}`}
                          className="group block bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="relative overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-700/20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <EventStatusBadge event={event} />
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-white text-xs font-medium drop-shadow">
                              <span className="material-symbols-outlined text-sm">
                                calendar_today
                              </span>
                              {displayEventDate(event.eventDate)}
                            </div>
                          </div>
                          <div className="p-3.5">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                              {event.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {event.clubName}
                            </p>
                            {event.totalSeats > 0 && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                {event.availableSeats} seats left
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-600">
                  dynamic_feed
                </span>
                Live Activity
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recent
              </span>
            </div>

            {activityFeed.length === 0 && !regsLoading ? (
              <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">
                  inbox
                </span>
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                  No activity yet
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">
                  Register for events and you&apos;ll see your activity here.
                </p>
                <Button as={Link} to="/student/events" size="md" className="mt-2 rounded-[12px]">
                  Browse Events
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {activityFeed.map((item) => (
                  <li key={item.id}>
                    {item.type === "registration" && item.eventId ? (
                      <Link
                        to={`/student/events/${item.eventId}`}
                        className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <ActivityIcon item={item} />
                        <ActivityBody item={item} />
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3.5 px-5 py-3.5">
                        <ActivityIcon item={item} />
                        <ActivityBody item={item} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function displayEventDate(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
}

function EventStatusBadge({ event }) {
  if (event?.isRegistered) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
        Registered
      </span>
    );
  }

  if (event?.status === "cancelled" || (event?.availableSeats ?? 0) === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        Closed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-600/10 dark:bg-primary-600/25 text-primary-600 dark:text-primary-200">
      Open
    </span>
  );
}

function ActivityIcon({ item }) {
  return (
    <div
      className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${item.iconBg}`}
    >
      <span className={`material-symbols-outlined text-base ${item.iconColor}`}>
        {item.icon}
      </span>
    </div>
  );
}

function ActivityBody({ item }) {
  const cfg = item.status ? statusConfig[item.status] ?? statusConfig.pending : null;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">
          {item.title}
        </p>
        <span className="flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
          {timeAgo(item.timestamp)}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
        {item.subtitle}
      </p>
      {cfg && (
        <span
          className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
        >
          <span className="material-symbols-outlined text-[10px]">{cfg.icon}</span>
          {cfg.label}
        </span>
      )}
    </div>
  );
}
