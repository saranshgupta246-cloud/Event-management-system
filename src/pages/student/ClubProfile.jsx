import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Terminal,
  MapPin,
  FileText,
  Calendar,
  Users,
  Clock,
  Link2,
  ZoomIn,
  ImageIcon,
} from "lucide-react";
import api from "../../api/client";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { eventRouteSegment } from "../../utils/eventRoutes";
import { fetchClubBySegment, isMongoObjectIdString } from "../../utils/clubIdentity";

const PLACEHOLDER_BANNER =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1440&h=320&fit=crop";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatApiEventForCard(ev) {
  const d = ev.eventDate ? new Date(ev.eventDate) : null;
  const timeLabel =
    ev.startTime && ev.endTime
      ? `${ev.startTime} – ${ev.endTime}`
      : ev.startTime || ev.endTime || "";
  const reg = typeof ev.totalSeats === "number" && typeof ev.availableSeats === "number"
    ? Math.max(0, ev.totalSeats - ev.availableSeats)
    : null;
  return {
    id: String(ev._id),
    title: ev.title || "Event",
    desc: ev.description || "",
    date: d ? MONTH_SHORT[d.getMonth()] : "",
    day: d ? String(d.getDate()) : "—",
    registered: reg,
    time: timeLabel,
    cta: "View Details",
    eventHref: `/student/events/${eventRouteSegment(ev)}`,
    coverUrl: ev.imageUrl ? resolveEventImageUrl(ev.imageUrl) : "",
  };
}

function emptyProfileShell() {
  return {
    name: "",
    tagline: "",
    banner: PLACEHOLDER_BANNER,
    logoUrl: null,
    members: 0,
    eventsCount: 0,
    recruitmentActive: false,
    about: [],
    committee: [],
    upcomingEvents: [],
    gallery: [],
    highlightsDriveUrl: "",
    websiteUrl: "",
  };
}

export default function ClubProfile() {
  const params = useParams();
  const clubSegment = params.slug ?? params.clubId;
  const location = useLocation();
  const navigate = useNavigate();
  const clubsListPath = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/admin/clubs/")) return "/admin/clubs";
    if (p.startsWith("/leader/clubs/")) return "/leader/club";
    return "/student/clubs";
  }, [location.pathname]);
  const [toast, setToast] = useState(null);
  const [apiClub, setApiClub] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [clubEventsTotal, setClubEventsTotal] = useState(null);
  const [clubUpcomingRaw, setClubUpcomingRaw] = useState([]);

  const needsApiFetch = Boolean(clubSegment);

  const [loading, setLoading] = useState(needsApiFetch);

  useEffect(() => {
    if (!needsApiFetch) {
      setLoading(false);
      setApiClub(null);
      setFetchError(false);
      return;
    }
    let cancelled = false;
    setFetchError(false);
    setApiClub(null);
    setLoading(true);
    (async () => {
      try {
        const club = await fetchClubBySegment(clubSegment);
        if (cancelled) return;
        if (club) {
          setApiClub(club);
        } else {
          setFetchError(true);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubSegment, needsApiFetch]);

  useEffect(() => {
    const apiClubId = apiClub?._id;
    if (!needsApiFetch || !clubSegment || !apiClubId) {
      setClubEventsTotal(null);
      setClubUpcomingRaw([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/clubs/${apiClubId}/events?limit=40&page=1`);
        if (cancelled || !res.data?.success) return;
        const payload = res.data.data;
        const total = typeof payload?.total === "number" ? payload.total : 0;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const upcoming = items
          .filter((ev) => {
            if (!ev?.eventDate) return false;
            const ed = new Date(ev.eventDate);
            return ed >= startOfToday && ev.status !== "cancelled";
          })
          .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
          .slice(0, 4);
        if (!cancelled) {
          setClubEventsTotal(total);
          setClubUpcomingRaw(upcoming);
        }
      } catch {
        if (!cancelled) {
          setClubEventsTotal(0);
          setClubUpcomingRaw([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClub?._id, clubSegment, needsApiFetch]);

  // Canonical slug URL when the user opened a legacy Mongo id link.
  useEffect(() => {
    if (!apiClub?.slug || !clubSegment) return;
    if (!isMongoObjectIdString(clubSegment)) return;
    if (String(apiClub._id) !== clubSegment) return;
    if (apiClub.slug === clubSegment) return;
    const path = location.pathname;
    if (path.startsWith("/student/clubs/")) {
      navigate(`/student/clubs/${apiClub.slug}`, { replace: true });
      return;
    }
    if (path.startsWith("/admin/clubs/") && path.includes("/preview")) {
      navigate(`/admin/clubs/${apiClub.slug}/preview`, { replace: true });
      return;
    }
    if (path.startsWith("/leader/clubs/") && path.includes("/preview")) {
      navigate(`/leader/clubs/${apiClub.slug}/preview`, { replace: true });
    }
  }, [apiClub, clubSegment, location.pathname, navigate]);

  const profile = useMemo(() => {
    if (!apiClub) return emptyProfileShell();
    const committee = (apiClub.coreTeam || []).map((m) => ({
      name: m.userId?.name || "Member",
      role: m.role || m.clubRole || "Member",
      avatar:
        m.userId?.avatar ||
        "https://placehold.co/80x80/e2e8f0/64748b?text=User",
    }));
    const upcomingEvents = clubUpcomingRaw.map(formatApiEventForCard);
    return {
      name: apiClub.name,
      tagline: apiClub.description || "MITS Gwalior",
      banner: resolveEventImageUrl(apiClub.bannerUrl) || PLACEHOLDER_BANNER,
      logoUrl: apiClub.logoUrl ? resolveEventImageUrl(apiClub.logoUrl) : null,
      highlightsDriveUrl: apiClub.highlightsDriveUrl || "",
      websiteUrl: apiClub.websiteUrl || "",
      members: apiClub.totalMembers ?? 0,
      eventsCount: clubEventsTotal ?? 0,
      recruitmentActive: false,
      about: apiClub.description
        ? [apiClub.description]
        : ["No description has been added for this club yet."],
      committee,
      upcomingEvents,
      gallery: [],
    };
  }, [apiClub, clubEventsTotal, clubUpcomingRaw]);

  if (!clubSegment) {
    return <Navigate to={clubsListPath} replace />;
  }

  if (loading && needsApiFetch) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (needsApiFetch && !loading && (fetchError || !apiClub)) {
    return <Navigate to={clubsListPath} replace />;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-[1440px] pb-16">
        <div className="relative h-[280px] w-full overflow-hidden bg-slate-200 md:h-[300px]">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <img src={profile.banner} alt="Club banner" className="h-full w-full object-cover" />
          <div className="absolute bottom-0 left-0 z-20 flex w-full items-end gap-4 p-6 md:gap-6 md:p-8">
            <div className="flex h-28 w-28 flex-shrink-0 rounded-xl border border-slate-100 bg-white p-2 shadow-xl dark:border-[#1e2d42] dark:bg-[#161f2e] md:h-32 md:w-32">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl || ""}
                  alt=""
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-primary-600 text-white">
                  <Terminal className="h-10 w-10 md:h-12 md:w-12" />
                </div>
              )}
            </div>
            <div className="mb-1 min-w-0 md:mb-2">
              <div className="mb-1 flex flex-wrap items-center gap-2 md:gap-3">
                <h1 className="text-2xl font-bold text-white md:text-4xl">{profile.name}</h1>
                {profile.recruitmentActive && (
                  <span className="rounded bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Active Recruitment
                  </span>
                )}
              </div>
              <p className="flex items-start gap-2 text-sm text-slate-200 md:text-base">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="line-clamp-2">{profile.tagline}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 px-4 sm:px-6 lg:mt-8 lg:grid-cols-[minmax(0,35%)_minmax(0,65%)] lg:gap-8 lg:px-8">
          <aside className="min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-[#1e2d42] dark:bg-[#1a2436]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Members
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-primary-600 md:text-2xl">{profile.members}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-[#1e2d42] dark:bg-[#1a2436]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Events
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-primary-600 md:text-2xl">{profile.eventsCount}</p>
                </div>
              </div>
            </div>

            <div
              id="core-committee"
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#1e2d42]">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Core Committee</h3>
              </div>
              <div className="space-y-3 p-4">
                {profile.committee?.length ? (
                  profile.committee.map((person, idx) => (
                    <div key={`${person.name}-${idx}`} className="flex items-center gap-3">
                      <img src={person.avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{person.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{person.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No committee listed yet.</p>
                )}
                <a
                  href="#club-main"
                  className="block w-full rounded-lg py-2 text-center text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-500/10"
                >
                  View All Team Members
                </a>
              </div>
            </div>

            {profile.websiteUrl && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
                <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                  Connect with us
                </h3>
                <div className="flex gap-3">
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-10 items-center justify-center rounded-lg bg-slate-100 transition-all hover:bg-primary-600 hover:text-white dark:bg-[#1e2d42]"
                    aria-label="Club website"
                  >
                    <Link2 className="h-5 w-5" />
                  </a>
                </div>
              </div>
            )}
          </aside>

          <div id="club-main" className="min-w-0 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <div className="mb-3 flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-primary-600" />
                <h2 className="text-lg font-bold md:text-xl">About the Club</h2>
              </div>
              <div className="prose prose-sm max-w-none leading-relaxed text-slate-600 dark:prose-invert dark:text-slate-400 md:prose-base">
                {profile.about?.map((p, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {p}
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-primary-600" />
                  <h2 className="text-lg font-bold md:text-xl">Upcoming Events</h2>
                </div>
                <Link to="/student/events" className="text-sm font-semibold text-primary-600 hover:underline">
                  View Calendar
                </Link>
              </div>
              {profile.upcomingEvents?.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {profile.upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all duration-300 hover:shadow-md dark:border-[#1e2d42] dark:bg-[#1a2436]"
                    >
                      <div className="relative h-36 overflow-hidden bg-slate-200 dark:bg-slate-700">
                        {ev.coverUrl ? (
                          <img src={ev.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-300 dark:bg-slate-600" />
                        )}
                        <div className="absolute left-2 top-2 rounded-lg bg-white/90 px-2.5 py-1 text-center shadow-sm backdrop-blur dark:bg-[#161f2e]/90">
                          <p className="text-[10px] font-bold uppercase text-primary-600">{ev.date}</p>
                          <p className="text-base font-black leading-none text-slate-900 dark:text-white">{ev.day}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-1 text-base font-bold transition-colors group-hover:text-primary-600">{ev.title}</h3>
                        <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{ev.desc}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-slate-400">
                            {ev.registered != null && ev.registered > 0 ? (
                              <>
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                <span>{ev.registered} registered</span>
                              </>
                            ) : ev.time ? (
                              <>
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{ev.time}</span>
                              </>
                            ) : null}
                          </span>
                          {ev.eventHref ? (
                            <Link
                              to={ev.eventHref}
                              className="shrink-0 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                            >
                              {ev.cta}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                            >
                              {ev.cta}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming events scheduled.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 shrink-0 text-primary-600" />
                  <h2 className="text-lg font-bold md:text-xl">Past Highlights</h2>
                </div>
                {profile.highlightsDriveUrl ? (
                  <a
                    href={profile.highlightsDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-primary-600 transition-colors hover:underline"
                  >
                    See all photos
                  </a>
                ) : (
                  <span className="text-sm font-medium text-slate-400">See all photos</span>
                )}
              </div>
              {profile.gallery?.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {profile.gallery.map((img, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Photos and highlights will appear here when shared by the club.</p>
              )}
            </section>
          </div>
        </div>
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
