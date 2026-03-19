import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  Moon, Sun, Monitor, Smile, Zap, FlaskConical, BookOpen, Rocket,
  Trophy, MapPin, Mail, ArrowRight, Calendar, ChevronRight,
} from "lucide-react";
import api from "../api/client";

const ROTATING_WORDS = ["Innovation", "Events", "Clubs", "Talent"];

const HOME_CACHE_PREFIX = "ems_home_v1:";
const HOME_CACHE_TTL_MS = 60_000; // 1 min: reduces refresh spam while staying fresh

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(HOME_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > HOME_CACHE_TTL_MS) return null;
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

function writeSessionCache(key, value) {
  try {
    sessionStorage.setItem(
      HOME_CACHE_PREFIX + key,
      JSON.stringify({ ts: Date.now(), value })
    );
  } catch {
    // ignore quota / private mode errors
  }
}

function runWhenIdle(fn, timeoutMs = 1200) {
  const ric = typeof window !== "undefined" ? window.requestIdleCallback : null;
  if (ric) return ric(() => fn(), { timeout: timeoutMs });
  return window.setTimeout(fn, timeoutMs);
}

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  const navigateExecuted = useRef(false);
  useEffect(() => {
    if (navigateExecuted.current || loading) return;
    if (isAuthenticated && user) {
      navigateExecuted.current = true;
      const dest =
        user.role === "admin"
          ? "/admin"
          : user.role === "faculty_coordinator"
          ? "/leader"
          : "/student";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme") || localStorage.getItem("ems_theme");
    if (saved) {
      setIsDark(saved === "dark");
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);
  useEffect(() => {
    const val = isDark ? "dark" : "light";
    localStorage.setItem("theme", val);
    localStorage.setItem("ems_theme", val);
    document.documentElement.setAttribute("data-theme", val);
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(false);
  const clubsRequested = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cachedStats = readSessionCache("stats");
        const cachedEvents = readSessionCache("events");
        if (cachedStats) setStats(cachedStats);
        if (cachedEvents) setEvents(Array.isArray(cachedEvents) ? cachedEvents : []);

        const reqs = [];
        if (!cachedStats) reqs.push(api.get("/api/public/stats"));
        else reqs.push(Promise.resolve({ data: { success: true, data: cachedStats } }));

        if (!cachedEvents) reqs.push(api.get("/api/public/events"));
        else reqs.push(Promise.resolve({ data: { success: true, data: cachedEvents } }));

        const [statsRes, eventsRes] = await Promise.allSettled(reqs);
        if (!alive) return;
        if (statsRes.status === "fulfilled" && statsRes.value.data?.success) {
          const val = statsRes.value.data.data;
          setStats(val);
          writeSessionCache("stats", val);
        }
        if (eventsRes.status === "fulfilled" && eventsRes.value.data?.success) {
          const val = eventsRes.value.data.data || [];
          setEvents(val);
          writeSessionCache("events", val);
        }
      } catch { /* silent */ }
      if (alive) setDataLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const requestClubs = useCallback(async () => {
    if (clubsRequested.current) return;
    clubsRequested.current = true;

    const cached = readSessionCache("clubs");
    if (cached) {
      setClubs(Array.isArray(cached) ? cached : []);
      return;
    }

    setClubsLoading(true);
    try {
      const res = await api.get("/api/clubs");
      if (res.data?.success) {
        const val = res.data.data || [];
        setClubs(val);
        writeSessionCache("clubs", val);
      }
    } catch { /* silent */ }
    setClubsLoading(false);
  }, []);

  useEffect(() => {
    const cached = readSessionCache("clubs");
    if (cached) {
      setClubs(Array.isArray(cached) ? cached : []);
      clubsRequested.current = true;
      return;
    }

    // fallback: load clubs when browser is idle, even if user never scrolls
    const id = runWhenIdle(() => requestClubs(), 1500);
    return () => {
      try {
        if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(id);
        } else {
          window.clearTimeout(id);
        }
      } catch {
        // ignore
      }
    };
  }, [requestClubs]);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden font-sans antialiased transition-colors duration-300 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <ScrollProgressBar />
      <Navbar navigate={navigate} isDark={isDark} setIsDark={setIsDark} scrollTo={scrollTo} hasEvents={events.length > 0} />
      <HeroSection navigate={navigate} isDark={isDark} stats={stats} dataLoading={dataLoading} events={events} />
      {events.length > 0 && <MarqueeStrip isDark={isDark} events={events} />}
      {events.length > 0 && <EventsSection isDark={isDark} events={events} navigate={navigate} />}
      <CategoryExplorer isDark={isDark} navigate={navigate} />
      {(clubs.length > 0 || clubsLoading) && <ClubsMarquee isDark={isDark} clubs={clubs} clubsLoading={clubsLoading} onNeedData={requestClubs} />}
      <HowItWorks isDark={isDark} />
      <CtaSection isDark={isDark} navigate={navigate} />
      <Footer isDark={isDark} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MITS LOGO (official crest image, flat like Stitch)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
function MitsLogo({ size = 40 }) {
  return (
    <img
      src="/mits-logo.png"
      alt="MITS Gwalior Logo"
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SCROLL PROGRESS                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ScrollProgressBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const h = () => { const d = document.documentElement; setW(d.scrollHeight - d.clientHeight > 0 ? (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100 : 0); };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed inset-x-0 top-0 z-[200] h-1" style={{ background: `linear-gradient(90deg, #3B82F6 ${w}%, transparent ${w}%)` }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  NAVBAR                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Navbar({ navigate, isDark, setIsDark, scrollTo, hasEvents }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const linkCls =
    "text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-slate-700 hover:text-blue-700 transition-colors";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ${
        scrolled ? "shadow-md" : ""
      } bg-[#e5edf9]`}
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center"
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 shrink-0"
          >
            <MitsLogo size={40} />
            <div className="hidden sm:block text-left">
              <span className="block font-extrabold text-lg leading-none text-blue-900">
                MITS GWALIOR
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">
                ESTD. 1957
              </span>
            </div>
          </button>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-10">
            {hasEvents && (
              <button
                type="button"
                onClick={() => scrollTo("events-section")}
                className={linkCls}
              >
                EVENTS
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollTo("category-section")}
              className={linkCls}
            >
              CLUBS
            </button>
            <button
              type="button"
              onClick={() => scrollTo("category-section")}
              className={linkCls}
            >
              INNOVATIONS
            </button>
            <button
              type="button"
              onClick={() => scrollTo("category-section")}
              className={linkCls}
            >
              GALLERY
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDark((p) => !p)}
              className="relative h-10 w-10 rounded-full flex items-center justify-center bg-blue-900 text-yellow-300 hover:bg-blue-800 transition-colors"
            >
              <Sun size={18} className="absolute transition-all duration-500" style={{ opacity: isDark ? 0 : 1, transform: isDark ? "scale(0.6)" : "scale(1)" }} />
              <Moon size={18} className="absolute transition-all duration-500" style={{ opacity: isDark ? 1 : 0, transform: isDark ? "scale(1)" : "scale(0.6)" }} />
            </button>
            <button type="button" onClick={() => navigate("/login")}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/30">
              PORTAL LOGIN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HERO                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection({ navigate, isDark, stats, dataLoading, events }) {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setWordIdx(i => (i + 1) % ROTATING_WORDS.length), 3000);
    return () => clearInterval(iv);
  }, []);

  const statItems = [
    { key: "events", label: "Annual Events", fallback: "0" },
    { key: "clubs", label: "Active Clubs", fallback: "0" },
    { key: "students", label: "Engaged Students", fallback: "0" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-blue-900" id="hero">
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 relative z-10 w-full">
        {/* Left */}
        <div className="flex flex-col justify-center text-white space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Campus Event Portal</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight">
            Where Campus Life Meets{" "}
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span key={wordIdx}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-blue-400 underline decoration-amber-400 decoration-4 underline-offset-8">
                  {ROTATING_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg text-slate-300 max-w-lg">
            Dive into a world of endless opportunities. From national-level hackathons to vibrant cultural fests, discover everything that makes MITS exceptional.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-wrap gap-4">
            <button type="button" onClick={() => navigate("/login")}
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-900 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2">
              Explore Events <ArrowRight size={20} />
            </button>
            <button type="button" onClick={() => navigate("/login")}
              className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
              Join a Club
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }}
            className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
            {statItems.map(s => (
              <div key={s.key}>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">
                  {dataLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-blue-800/50" /> : (
                    stats?.[s.key] != null ? `${stats[s.key].toLocaleString()}+` : s.fallback
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right - Floating glass card (Live Activity from backend events) */}
        <div className="hidden lg:flex flex-col justify-center items-end">
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-sm animate-[float_6s_ease-in-out_infinite]"
            style={{ animation: "float 6s ease-in-out infinite" }}>
            <div className="rounded-3xl p-6 space-y-5 shadow-2xl border border-white/10"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-white font-bold text-lg">Live Activity</h3>
                <span className="text-blue-400 text-xs font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" /> LIVE
                </span>
              </div>
              {(events || []).slice(0, 3).map((ev) => {
                const initial = (ev.clubName || ev.title || "E").trim()[0]?.toUpperCase() || "E";
                const color =
                  ev.status === "ongoing"
                    ? "bg-emerald-500"
                    : ev.status === "upcoming"
                    ? "bg-blue-500"
                    : "bg-slate-500";
                const when = ev.eventDate
                  ? new Date(ev.eventDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Scheduled";
                return (
                  <button
                    key={ev._id}
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full text-left flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-colors"
                  >
                    <div
                      className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {ev.title}
                      </p>
                      <p className="text-slate-400 text-[10px] line-clamp-1">
                        {(ev.clubName || "MITS Campus") + " · " + when}
                      </p>
                    </div>
                  </button>
                );
              })}
              {(!events || events.length === 0) && (
                <p className="text-slate-400 text-xs text-center py-4">
                  No live activity yet. Check back when new events are announced.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MARQUEE STRIP                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
function MarqueeStrip({ isDark, events }) {
  const items = events.slice(0, 4).map(e => e.title);
  if (items.length === 0) return null;
  const content = items.map(t => (
    <span key={t} className="mx-8 font-bold text-sm tracking-widest uppercase flex items-center shrink-0">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
      {t}
    </span>
  ));
  return (
    <div className="sticky top-[4.5rem] z-40 bg-blue-600 text-white py-3 shadow-xl overflow-hidden">
      <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite]">
        {content}{content}
      </div>
      <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  EVENTS SECTION                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
function EventsSection({ isDark, events, navigate }) {
  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBA";
  const bg = isDark ? "bg-slate-950" : "bg-white";

  return (
    <section id="events-section" className={`py-24 px-4 ${bg}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-4">
          <div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${isDark ? "text-white" : "text-blue-900"}`}>Upcoming Events</h2>
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>Don't miss out on the most anticipated campus gatherings.</p>
          </div>
          <button type="button" onClick={() => navigate("/login")}
            className="text-blue-500 font-bold border-b-2 border-blue-500 pb-1 hover:text-blue-400 transition-colors shrink-0">
            View All Events
          </button>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.slice(0, 6).map((ev, i) => (
            <motion.div key={ev._id} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div className="relative h-56 overflow-hidden">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 group-hover:scale-110 transition-transform duration-700" />
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight shadow-lg ${ev.status === "ongoing" ? "bg-red-500" : "bg-blue-500"}`}>
                    {ev.status === "ongoing" ? "Live Now" : "Upcoming"}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center text-xs font-bold text-blue-500 mb-3 uppercase tracking-widest">
                  <Calendar size={14} className="mr-2" />
                  {fmtDate(ev.eventDate)}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-blue-900"}`}>{ev.title}</h3>
                <p className={`text-sm mb-5 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {ev.description || `Organised by ${ev.clubName || "MITS Campus"}`}
                </p>
                <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {ev.clubName || "MITS Campus"}
                    {ev.totalSeats > 0 && ` · ${Math.max(0, ev.availableSeats ?? 0)} seats left`}
                  </span>
                  <button type="button" onClick={() => navigate("/login")}
                    className={`font-extrabold text-sm uppercase tracking-widest group-hover:text-blue-500 transition-colors ${isDark ? "text-slate-300" : "text-blue-900"}`}>
                    Register <ChevronRight size={14} className="inline" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CATEGORY EXPLORER                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { icon: Monitor, label: "Technical", color: "blue" },
  { icon: Smile, label: "Cultural", color: "pink" },
  { icon: Zap, label: "Sports", color: "green" },
  { icon: FlaskConical, label: "Innovation", color: "purple" },
  { icon: BookOpen, label: "Literary", color: "orange" },
  { icon: Rocket, label: "Workshops", color: "yellow" },
];

const colorMap = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-500",   hoverBg: "group-hover:bg-blue-500" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-500",   hoverBg: "group-hover:bg-pink-500" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  hoverBg: "group-hover:bg-green-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", hoverBg: "group-hover:bg-purple-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-500", hoverBg: "group-hover:bg-orange-500" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", hoverBg: "group-hover:bg-yellow-600" },
};

function CategoryExplorer({ isDark, navigate }) {
  return (
    <section id="category-section" className={`py-24 border-y ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <motion.div {...fadeUp} className="text-center mb-16">
          <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${isDark ? "text-white" : "text-blue-900"}`}>Explore by Interests</h2>
          <p className={`max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Discover niche communities and specialized events tailored to your academic and creative pursuits.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {CATEGORIES.map((cat, i) => {
            const c = colorMap[cat.color];
            const Icon = cat.icon;
            return (
              <motion.div key={cat.label} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => navigate(`/clubs?category=${encodeURIComponent(cat.label)}`)}
                className={`group p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center flex flex-col items-center cursor-pointer ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-white"}`}>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${c.bg} ${c.text} ${c.hoverBg} group-hover:text-white`}>
                  <Icon size={32} />
                </div>
                <span className={`font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cat.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CLUBS MARQUEE                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ClubsMarquee({ isDark, clubs, clubsLoading, onNeedData }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (clubs && clubs.length > 0) return;
    if (clubsLoading) return;
    const el = rootRef.current;
    if (!el) return;
    if (!onNeedData) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onNeedData();
      },
      { root: null, rootMargin: "250px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [clubs, clubsLoading, onNeedData]);

  const names = clubs.map(c => c.name?.toUpperCase()).filter(Boolean);
  if (names.length === 0 && !clubsLoading) return null;
  const content = names.map(n => (
    <span key={n} className={`text-2xl sm:text-3xl font-black mx-8 sm:mx-12 shrink-0 transition-all cursor-default ${isDark ? "text-slate-700 hover:text-white" : "text-slate-200 hover:text-blue-900"}`}>
      {n}
    </span>
  ));
  return (
    <section ref={rootRef} className={`py-12 overflow-hidden border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-100"}`}>
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h3 className={`text-xs font-bold uppercase tracking-widest text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>Trusted Club Ecosystem</h3>
      </div>
      <div className="flex overflow-hidden">
        {names.length > 0 ? (
          <div className="flex items-center py-4 animate-[marquee_30s_linear_infinite]">{content}{content}</div>
        ) : (
          <div className={`mx-auto py-6 text-sm font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Loading clubs…
          </div>
        )}
      </div>
      <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOW IT WORKS                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
function HowItWorks({ isDark }) {
  const steps = [
    { n: 1, title: "Browse", desc: "Explore live and upcoming events in the portal." },
    { n: 2, title: "Register", desc: "Secure your spot with one-click portal registration." },
    { n: 3, title: "Attend", desc: "Participate and engage with industry experts." },
    { n: 4, title: "Certificate", desc: "Download your verified e-certificates." },
  ];
  return (
    <section className={`py-24 relative overflow-hidden ${isDark ? "bg-blue-900 text-white" : "bg-blue-900 text-white"}`}>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div {...fadeUp} className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">How it Works</h2>
          <p className="text-slate-300">Your journey from curiosity to certification.</p>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-400/40 to-blue-400/0 z-0" />
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center group">
              <div className="h-20 w-20 bg-blue-500/20 border-2 border-blue-400 rounded-full flex items-center justify-center text-2xl font-black mb-6 group-hover:bg-blue-500 transition-all duration-300">
                {s.n}
              </div>
              <h4 className="text-xl font-bold mb-2">{s.title}</h4>
              <p className="text-slate-300 text-sm max-w-[200px]">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CTA                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
function CtaSection({ isDark, navigate }) {
  return (
    <section className="py-24 px-4">
      <motion.div {...fadeUp} className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-blue-500 opacity-20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-blue-500 opacity-20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">Ready to be part of campus life?</h2>
            <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already shaping their future through MITS's vibrant event ecosystem.
            </p>
            <button type="button" onClick={() => navigate("/login")}
              className="bg-white text-blue-900 px-12 py-5 rounded-2xl font-black text-xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl hover:shadow-white/20">
              Get Started Today
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FOOTER                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Footer({ isDark }) {
  return (
    <footer className={`pt-20 pb-10 border-t ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <MitsLogo isDark={isDark} size={56} />
            <div>
              <span className={`block font-extrabold text-xl leading-none ${isDark ? "text-white" : "text-blue-900"}`}>MITS GWALIOR</span>
              <span className={`text-xs font-medium uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Madhav Institute of Technology & Science
              </span>
            </div>
          </div>
          <p className={`max-w-md leading-relaxed mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            A premier institution dedicated to creating leaders in engineering, architecture, and technology since 1957.
          </p>
        </div>

        <div>
          <h4 className={`font-bold mb-6 uppercase tracking-widest text-sm ${isDark ? "text-white" : "text-blue-900"}`}>Quick Links</h4>
          <ul className={`space-y-4 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {["Event Calendar", "Clubs Directory", "Verify Certificate", "Student Portal"].map(l => (
              <li key={l}><span className="hover:text-blue-500 transition-colors cursor-pointer">{l}</span></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`font-bold mb-6 uppercase tracking-widest text-sm ${isDark ? "text-white" : "text-blue-900"}`}>Contact</h4>
          <ul className={`space-y-4 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
              Race Course Road, Gole ka Mandir, Gwalior (M.P.)
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-blue-500 shrink-0" />
              helpdesk@mitsgwalior.in
            </li>
          </ul>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 pt-10 border-t flex flex-col md:flex-row justify-between items-center text-xs font-bold uppercase tracking-widest gap-4 ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
        <p>© {new Date().getFullYear()} Madhav Institute of Technology & Science. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SHARED ANIMATION                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6 },
};

export default Home;
