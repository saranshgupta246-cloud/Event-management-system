import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Theater,
  Award,
  Moon,
  Sun,
  X,
  LayoutGrid,
  Home as HomeIcon,
  ShieldCheck,
  LogIn,
} from "lucide-react";

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function Home() {
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(true);
  const [activeCard, setActiveCard] = useState(null); // "events" | "clubs" | "certs" | null
  const [showInfo, setShowInfo] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        setIsDark(saved === "dark");
        document.documentElement.setAttribute("data-theme", saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }

      @keyframes shimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const handleBackgroundClick = () => {
    if (fabOpen) setFabOpen(false);
    if (activeCard !== null) setActiveCard(null);
  };

  useEffect(() => {
    if (activeCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeCard]);

  const toggleCard = (key) => {
    setActiveCard((prev) => (prev === key ? null : key));
  };

  return (
    <div
      style={{
        backgroundColor: isDark ? "#0a0a0f" : "#f5f5f5",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        color: isDark ? "white" : "#0f172a",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
      className="relative"
      onClick={handleBackgroundClick}
    >
      <LiquidNavbar
        navigate={navigate}
        isDark={isDark}
        setIsDark={setIsDark}
      />
      <main className="relative flex h-full w-full items-center justify-center pt-16">
        <HeroSection navigate={navigate} isDark={isDark} />

        {/* FAB menu - bottom right */}
        <div
          className="pointer-events-auto fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* FAB menu items */}
          <AnimatePresence>
            {fabOpen && (
              <>
                {[
                  {
                    key: "certs",
                    label: "Certificates",
                    icon: Award,
                    color: "#f59e0b",
                  },
                  {
                    key: "clubs",
                    label: "Clubs",
                    icon: Theater,
                    color: "#a855f7",
                  },
                  {
                    key: "events",
                    label: "Events",
                    icon: CalendarDays,
                    color: "#6366f1",
                  },
                ].map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.06,
                        ease: "backOut",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCard((prev) =>
                            prev === item.key ? null : item.key
                          );
                          setFabOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 16px",
                          borderRadius: 50,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          border: "1px solid",
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(255,255,255,0.75)",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.9)",
                          color: isDark ? "#ffffff" : "#0f172a",
                          boxShadow: isDark
                            ? "none"
                            : "0 4px 20px rgba(0,0,0,0.08)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          transition: "all 0.2s ease",
                        }}
                        className="group"
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            backgroundColor: `${item.color}22`,
                            color: item.color,
                          }}
                        >
                          <IconComp size={14} />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </>
            )}
          </AnimatePresence>

          {/* Main FAB trigger button */}
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2, ease: "backOut" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setFabOpen((prev) => !prev);
              if (!fabOpen) {
                setActiveCard(null);
              }
            }}
            className="h-12 w-12 sm:h-[52px] sm:w-[52px]"
            style={{
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              border: "none",
              background:
                "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: isDark
                ? "0 8px 25px rgba(99,102,241,0.4)"
                : "0 8px 25px rgba(99,102,241,0.3)",
            }}
          >
            <motion.div
              key={fabOpen ? "close" : "grid"}
              initial={{ opacity: 0, rotate: fabOpen ? -90 : 90 }}
              animate={{ opacity: 1, rotate: fabOpen ? 90 : 0 }}
              exit={{ opacity: 0, rotate: fabOpen ? 0 : -90 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {fabOpen ? (
                <X size={20} color="#ffffff" />
              ) : (
                <LayoutGrid size={20} color="#ffffff" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Info button - bottom left */}
        <div
          className="pointer-events-auto fixed bottom-5 left-4 z-50 md:bottom-8 md:left-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all duration-300 ${
              isDark
                ? "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30 hover:text-white"
                : "bg-black/5 border-black/10 text-slate-500 hover:bg-black/10 hover:border-black/20 hover:text-slate-700"
            }`}
          >
            i
          </button>
        </div>

        {/* Info card */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(8px)" }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: 0.3, ease: "easeOut" },
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.97,
                filter: "blur(4px)",
                transition: { duration: 0.2, ease: "easeInOut" },
              }}
              className={`pointer-events-auto fixed bottom-24 left-4 z-40 w-[220px] rounded-2xl border p-5 text-xs transition-all duration-300 md:bottom-24 md:left-8`}
              style={{
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.9)"
                  : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.08)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.3)"
                  : "0 8px 32px rgba(0,0,0,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                className={`text-sm font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                MITS EMS
              </p>
              <p
                className={`mt-1 text-[11px] ${
                  isDark ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Event Management System
              </p>
              <div
                className={`my-3 h-px ${
                  isDark ? "bg-white/10" : "bg-black/10"
                }`}
              />
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Madhav Institute of Technology &amp; Science, Gwalior
              </p>
              <p
                className={`mt-2 text-[11px] ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                v1.0.0
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile overlay - tap to close card on small screens */}
        <AnimatePresence>
          {activeCard && (
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[58] bg-black/60 sm:hidden"
              onClick={() => setActiveCard(null)}
              style={{ pointerEvents: "auto" }}
            />
          )}
        </AnimatePresence>

        {/* Toggle cards - frosted glass */}
        <AnimatePresence mode="wait">
          {activeCard && (
            <div
              className="pointer-events-auto fixed left-1/2 top-1/2 z-[60] h-[75vh] max-h-[75vh] w-[calc(100vw-40px)] max-w-[320px] -translate-x-1/2 -translate-y-1/2 sm:left-auto sm:right-6 sm:top-1/2 sm:z-[49] sm:h-auto sm:max-h-none sm:w-[300px] sm:max-w-[300px] sm:translate-x-0 sm:-translate-y-1/2"
              style={{ pointerEvents: "auto" }}
            >
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(8px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.97,
                  filter: "blur(4px)",
                  transition: { duration: 0.2, ease: "easeInOut" },
                }}
                className="h-full overflow-y-auto rounded-3xl border p-0 text-sm sm:h-auto sm:overflow-visible"
                style={{
                  padding: 0,
                  backgroundColor: isDark
                    ? "rgba(15,15,25,0.6)"
                    : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.8)",
                  boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
                    : "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
                  color: isDark ? "#ffffff" : "#0f172a",
                }}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Curved glass reflection inside card */}
              <div
                style={{
                  position: "absolute",
                  top: 1,
                  left: 1,
                  right: 1,
                  height: "40%",
                  borderRadius: "24px 24px 12px 12px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />

              <div className="relative z-[1] p-7">
                {activeCard === "events" && (
                  <EventsCard
                    isDark={isDark}
                    onClose={() => setActiveCard(null)}
                    navigate={navigate}
                  />
                )}
                {activeCard === "clubs" && (
                  <ClubsCard
                    isDark={isDark}
                    onClose={() => setActiveCard(null)}
                    navigate={navigate}
                  />
                )}
                {activeCard === "certs" && (
                  <CertificatesCard
                    isDark={isDark}
                    onClose={() => setActiveCard(null)}
                    navigate={navigate}
                  />
                )}
              </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function getActiveKeyFromPath(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/verify") return "verify";
  if (pathname === "/login") return "login";
  return "home";
}

function LiquidNavbar({ navigate, isDark, setIsDark }) {
  const location = useLocation();
  const [activeBtn, setActiveBtn] = useState(() =>
    getActiveKeyFromPath(location.pathname)
  );
  const [pillStyle, setPillStyle] = useState({
    width: 0,
    left: 0,
  });
  const navRef = useRef(null);
  const buttonRefs = useRef({});

  const updatePillForKey = (key) => {
    const el = buttonRefs.current[key];
    const navEl = navRef.current;
    if (!el || !navEl) return;
    const navRect = navEl.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const left = rect.left - navRect.left;
    setPillStyle({
      width: rect.width,
      left,
    });
  };

  useEffect(() => {
    setActiveBtn(getActiveKeyFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    updatePillForKey(activeBtn);
    const handleResize = () => updatePillForKey(activeBtn);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBtn]);

  useEffect(() => {
    const t = setTimeout(() => updatePillForKey(activeBtn), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBtn]);
  const handleNavMouseMove = (e) => {
    const navEl = navRef.current;
    if (!navEl) return;
    const rect = navEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    navEl.style.setProperty("--x", `${x}%`);
    navEl.style.setProperty("--y", `${y}%`);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center">
      <div
        ref={navRef}
        onMouseMove={handleNavMouseMove}
        className="relative flex items-center px-2 py-1"
        style={{
          borderRadius: 999,
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06)"
            : "0 8px 32px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.4)",
          backgroundColor: isDark
            ? "rgba(10,10,15,0.3)"
            : "rgba(248,248,255,0.35)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(255,255,255,0.6)",
          pointerEvents: "auto",
          whiteSpace: "nowrap",
          borderWidth: 1,
          marginTop: 12,
        }}
      >
        {/* Curved reflection */}
        <div
          style={{
            content: '""',
            position: "absolute",
            top: 1,
            left: 1,
            right: 1,
            height: "46%",
            borderRadius:
              "99px 99px 24px 24px / 99px 99px 12px 12px",
            pointerEvents: "none",
            zIndex: 6,
            background: isDark
              ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Mouse glare layer */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: 999, pointerEvents: "none" }}
        >
          <div
            className="h-full w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle 90px at var(--x,50%) var(--y,50%), rgba(255,255,255,0.15) 0%, transparent 100%)",
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Sliding pill */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 4,
            left: pillStyle.left,
            width: pillStyle.width,
            height: 44,
            borderRadius: 999,
            transition:
              "transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: isDark
              ? "inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 flex items-center gap-1">
          {/* Logo + text group */}
          <div
            className="mr-1 flex items-center gap-2 sm:mr-2"
            style={{
              marginRight: 4,
              paddingInline: 8,
              paddingBlock: 4,
              gap: 8,
            }}
          >
            <img
              src="/images/mits-logo-main.png"
              alt="MITS Logo"
              className="h-7 w-7 shrink-0 rounded-lg object-cover sm:h-[30px] sm:w-[30px]"
            />
            <div className="flex flex-col">
              <span
                className="text-[11px] font-bold leading-tight sm:text-xs"
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                }}
              >
                MITS EMS
              </span>
              <span
                className="mt-0.5 hidden text-[9px] font-medium leading-tight sm:block"
                style={{
                  color: isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.4)",
                }}
              >
                Event Management
              </span>
            </div>
          </div>

          {/* Divider after logo group */}
          <div
            className="mx-2 h-6 w-px"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.15)",
            }}
          />

          {/* Home */}
          <button
            type="button"
            ref={(el) => {
              buttonRefs.current.home = el;
            }}
            onClick={() => {
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigate("/");
              }
            }}
            className="flex items-center gap-2 px-5"
            style={{
              height: 44,
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
              transition: "color 0.3s ease, transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              color:
                activeBtn === "home"
                  ? isDark
                    ? "white"
                    : "rgba(0,0,0,0.95)"
                  : isDark
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(0,0,0,0.5)",
            }}
          >
            <HomeIcon size={17} />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Verify */}
          <button
            type="button"
            ref={(el) => {
              buttonRefs.current.verify = el;
            }}
            onClick={() => navigate("/verify")}
            className="flex items-center gap-2 px-5"
            style={{
              height: 44,
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
              transition: "color 0.3s ease, transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              color:
                activeBtn === "verify"
                  ? isDark
                    ? "white"
                    : "rgba(0,0,0,0.95)"
                  : isDark
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(0,0,0,0.5)",
            }}
          >
            <ShieldCheck size={17} />
            <span className="hidden sm:inline">Verify</span>
          </button>

          {/* Login */}
          <button
            type="button"
            ref={(el) => {
              buttonRefs.current.login = el;
            }}
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-5"
            style={{
              height: 44,
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
              transition: "color 0.3s ease, transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              color:
                activeBtn === "login"
                  ? isDark
                    ? "white"
                    : "rgba(0,0,0,0.95)"
                  : isDark
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(0,0,0,0.5)",
            }}
          >
            <LogIn size={17} />
            <span className="hidden sm:inline">Login</span>
          </button>

          {/* Divider */}
          <div
            className="mx-1 hidden h-6 w-px sm:block"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.15)",
            }}
          />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="relative hidden items-center justify-center sm:flex"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "transparent",
            }}
          >
            <Sun
              className="absolute"
              style={{
                transition:
                  "transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.4s ease",
                transform: isDark
                  ? "rotate(90deg) scale(0)"
                  : "rotate(0deg) scale(1)",
                opacity: isDark ? 0 : 1,
                color: "#fbbf24",
              }}
              size={18}
            />
            <Moon
              className="absolute"
              style={{
                transition:
                  "transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.4s ease",
                transform: isDark
                  ? "rotate(0deg) scale(1)"
                  : "rotate(-90deg) scale(0)",
                opacity: isDark ? 1 : 0,
                color: "#6366f1",
              }}
              size={18}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ navigate, isDark }) {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = isDark ? "#0a0a0f" : "#f8f8ff";
      ctx.fillRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * (isDark ? 0.5 : 0.3);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(140,120,255,${alpha})`
              : `rgba(99,102,241,${alpha * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? "rgba(180,160,255,0.9)"
          : "rgba(99,102,241,0.5)";
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <section
      className="relative flex h-full w-full items-center justify-center px-4 pt-4 sm:px-6 lg:px-8 transition-colors duration-300"
      ref={heroRef}
      style={{
        backgroundColor: isDark ? "#0a0a0f" : "#fafafa",
      }}
    >
      {/* Constellation canvas background */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center px-5 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full transition-colors duration-300"
          style={{
            paddingInline: 16,
            paddingBlock: 6,
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            border: isDark
              ? "1px solid rgba(255,255,255,0.15)"
              : "1px solid rgba(99,102,241,0.3)",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(99,102,241,0.06)",
            color: isDark
              ? "rgba(255,255,255,0.6)"
              : "#6366f1",
          }}
        >
          <span>✦ MITS GWALIOR · EST. 1957 ✦</span>
        </motion.div>

        <div
          className="mt-8 flex flex-col items-center"
          style={{ gap: 4, marginBottom: 20 }}
        >
          <div className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: "clamp(26px, 7vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1.1,
                color: isDark ? "#ffffff" : "#0f172a",
              }}
            >
              Where Campus
            </motion.div>
          </div>
          <div className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                fontSize: "clamp(26px, 7vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1.1,
                color: isDark ? "#ffffff" : "#0f172a",
              }}
            >
              Life Meets
            </motion.div>
          </div>
          <div className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              style={{
                fontSize: "clamp(26px, 7vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1.1,
                backgroundImage:
                  "linear-gradient(135deg,#6366f1 0%,#a855f7 40%,#ec4899 70%,#f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundSize: "200% 200%",
                animation: "shimmer 4s ease infinite",
              }}
            >
              Excellence.
            </motion.div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{
            marginTop: 20,
            marginBottom: 32,
            maxWidth: 420,
            fontSize: 16,
            lineHeight: 1.6,
            textAlign: "center",
            color: isDark
              ? "rgba(255,255,255,0.5)"
              : "rgba(15,23,42,0.5)",
          }}
        >
          One platform for Events, Clubs &amp; Certificates at Madhav
          Institute.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="hero-buttons flex w-full max-w-[260px] flex-col items-center gap-3 sm:max-w-none"
        >
          <motion.button
            type="button"
            whileHover={{
              y: -2,
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
            whileTap={{ scale: 0.97 }}
            className={`w-full rounded-full px-6 py-3 text-[15px] font-semibold transition-all duration-300 sm:w-auto sm:px-7 ${
              isDark
                ? "bg-white text-slate-900"
                : "bg-slate-900 text-white"
            }`}
            style={{
              borderRadius: 999,
              paddingInline: 24,
              paddingBlock: 12,
              boxShadow: isDark
                ? "0 0 40px rgba(255,255,255,0.15)"
                : "0 8px 24px rgba(0,0,0,0.25)",
            }}
            onClick={() => navigate("/login")}
          >
            Get Started →
          </motion.button>
          <motion.button
            type="button"
            whileHover={{
              y: -2,
            }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-full px-6 py-3 text-[15px] font-semibold transition-all duration-300 sm:w-auto sm:px-7"
            style={{
              borderRadius: 999,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.15)"
                : "1px solid rgba(0,0,0,0.12)",
              color: isDark ? "#ffffff" : "#0f172a",
              backdropFilter: isDark ? "blur(10px)" : "none",
            }}
            onClick={() => navigate("/login")}
          >
            Explore Features
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function EventsCard({ isDark, onClose, navigate }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 text-sm transition-all duration-300 ${
              isDark
                ? "bg-blue-500/20 text-blue-300"
                : "bg-blue-500/10 text-blue-600"
            }`}
          >
            <CalendarDays size={18} />
          </div>
          <div>
            <p
              className="whitespace-nowrap text-base font-bold sm:text-[16px]"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.95)"
                  : "#0f172a",
              }}
            >
              Campus Events
            </p>
            <p
              className="mt-1 text-xs"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(15,23,42,0.55)",
              }}
            >
              Discover and join events happening across MITS campus
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-full p-1 transition-colors duration-300 ${
            isDark
              ? "text-white/50 hover:text-white"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 space-y-2 text-sm">
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🗓</span>
          <span>Register for upcoming workshops</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>✅</span>
          <span>Track your attendance</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🏆</span>
          <span>Win certificates &amp; recognition</span>
        </div>
      </div>
    </div>
  );
}

function ClubsCard({ isDark, onClose, navigate }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 text-sm transition-all duration-300 ${
              isDark
                ? "bg-purple-500/20 text-purple-300"
                : "bg-purple-500/10 text-purple-600"
            }`}
          >
            <Theater size={18} />
          </div>
          <div>
            <p
              className="whitespace-nowrap text-[15px] font-bold sm:text-[16px]"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.95)"
                  : "#0f172a",
              }}
            >
              Student Clubs
            </p>
            <p
              className="mt-1 text-xs"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(15,23,42,0.55)",
              }}
            >
              Join clubs, build skills, and lead your community at MITS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-full p-1 transition-colors duration-300 ${
            isDark
              ? "text-white/50 hover:text-white"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 space-y-2 text-sm">
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🎭</span>
          <span>Explore 10+ active clubs</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>👥</span>
          <span>Connect with like-minded students</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🚀</span>
          <span>Apply for leadership roles</span>
        </div>
      </div>
    </div>
  );
}

function CertificatesCard({ isDark, onClose, navigate }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 text-sm transition-all duration-300 ${
              isDark
                ? "bg-amber-500/20 text-amber-300"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <Award size={18} />
          </div>
          <div>
            <p
              className="whitespace-nowrap text-base font-bold sm:text-[16px]"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.95)"
                  : "#0f172a",
              }}
            >
              Certificates
            </p>
            <p
              className="mt-1 text-xs"
              style={{
                color: isDark
                  ? "rgba(255,255,255,0.55)"
                  : "rgba(15,23,42,0.55)",
              }}
            >
              Earn verified certificates for your participation and achievements
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-full p-1 transition-colors duration-300 ${
            isDark
              ? "text-white/50 hover:text-white"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2 space-y-2 text-sm">
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🎓</span>
          <span>Auto-generated on completion</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>🔍</span>
          <span>Blockchain-style verification</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            color: isDark
              ? "rgba(255,255,255,0.75)"
              : "rgba(71,85,105,1)",
          }}
        >
          <span>💼</span>
          <span>Share directly to LinkedIn</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
