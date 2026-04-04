import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ALLOWED_DOMAIN = "mitsgwl.ac.in";

const messages = [
  { icon: "✨", text: "Manage Events Effortlessly" },
  { icon: "🏆", text: "Track Club Performance" },
  { icon: "📜", text: "Issue Verified Certificates" },
  { icon: "🎓", text: "Built for MITS Community" },
];

export default function Login() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme") || localStorage.getItem("ems_theme");
      return saved === "dark";
    } catch {
      return false;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Redirect if already authenticated (with guard to prevent infinite loop)
  const navigateExecuted = useRef(false);
  useEffect(() => {
    // Skip if still loading, no user, already navigated, or on dashboard
    if (
      navigateExecuted.current ||
      authLoading ||
      !user ||
      location.pathname.includes("/dashboard")
    ) {
      return;
    }

    if (isAuthenticated && user) {
      console.log("Login - Already authenticated, redirecting...");
      navigateExecuted.current = true;
      const savedMode = localStorage.getItem("ems_view_mode");
      const hasClubAccess = (user.clubIds?.length ?? 0) > 0;
      if (savedMode === "club" && !hasClubAccess) {
        localStorage.setItem("ems_view_mode", "student");
      }
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "faculty_coordinator") {
        navigate("/leader", { replace: true });
      } else if (savedMode === "club" && hasClubAccess) {
        navigate("/leader", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  useEffect(() => {
    const val = isDark ? "dark" : "light";
    localStorage.setItem("theme", val);
    localStorage.setItem("ems_theme", val);
    document.documentElement.setAttribute("data-theme", val);
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    // Direct navigation - no loading state to avoid re-render issues
    const apiBase =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    const oauthUrl = `${origin}/api/auth/google`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row">
      {/* Dark / light toggle - synced with app theme */}
      <motion.button
        type="button"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsDark((d) => !d)}
        className={`fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border text-sm shadow-sm transition ${
          isDark
            ? "border-slate-600 bg-slate-800 text-amber-300"
            : "border-slate-200 bg-slate-100 text-slate-700"
        }`}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.button>
      
      {/* Left showcase panel */}
      <div className="relative hidden w-3/5 items-center justify-center overflow-hidden bg-blue-900 md:flex">
        {/* Background orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <motion.div
            className="absolute -left-40 -top-40 h-[520px] w-[520px]"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
              filter: "blur(2px)",
            }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 right-[-120px] h-[420px] w-[420px]"
            style={{
              background:
                "radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%)",
              filter: "blur(2px)",
            }}
            animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
          {/* Orbital logo */}
          <div className="relative h-40 w-40">
            {/* Ring 1 */}
            <motion.div
              className="absolute inset-0 rounded-full border border-dashed border-indigo-500/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
            </motion.div>

            {/* Ring 2 */}
            <motion.div
              className="absolute inset-4 rounded-full border border-purple-500/40"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-1/2 -left-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.9)]" />
            </motion.div>

            {/* Inner glow ring */}
            <motion.div
              className="absolute inset-7 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.2), transparent)",
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Logo */}
            <div className="relative flex h-40 w-40 items-center justify-center">
              <img
                src="/images/mits-logo-main.png"
                alt="MITS Logo"
                className="h-20 w-20 rounded-full border border-white/10 bg-white/90 object-contain shadow-xl"
              />
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold text-white">
            MITS Event Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Madhav Institute of Technology & Science
          </p>

          <div className="mt-6 h-px w-16 bg-white/10" />

          {/* Cycling messages */}
          <div className="mt-8 h-[60px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={messages[messageIndex].text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="text-2xl">
                  {messages[messageIndex].icon}
                </div>
                <div className="mt-1 text-lg font-medium text-slate-200">
                  {messages[messageIndex].text}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              🔒 Secure Login
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              ⚡ Real-time
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              📱 Mobile Ready
            </span>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div
        className="relative flex w-full flex-col items-center justify-center px-6 py-12 sm:px-8 md:w-2/5 transition-colors duration-300 bg-white dark:bg-slate-950"
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Greeting */}
          <div className="w-full text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Sign in to MITS EMS
            </h2>
          </div>

          {/* Google sign-in - using button for programmatic navigation */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-[15px] font-semibold transition-all border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)] cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Note about email requirement */}
          <div className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100">
            Only @{ALLOWED_DOMAIN} emails are allowed
          </div>

          {/* Privacy note */}
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400 dark:text-slate-500">
            <Lock className="h-3.5 w-3.5" />
            <span>
              Your data is protected under MITS privacy policy. We never share
              your information.
            </span>
          </p>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← Back to Home
            </button>
          </div>

          {/* Copyright */}
          <p className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-600">
            {"\u00A9 "}
            {new Date().getFullYear()} MITS Gwalior {"\u00B7"} All rights reserved
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.22 3.31v2.77h3.59c2.11-1.94 3.27-4.79 3.27-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.59-2.77c-1 .67-2.29 1.08-3.69 1.08-2.84 0-5.24-1.92-6.1-4.51H2.18v2.84A11 11 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.9 14.14A6.62 6.62 0 015.54 12c0-.74.13-1.45.36-2.14V7.02H2.18A11 11 0 001 12c0 1.8.43 3.5 1.18 4.98l3.72-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.02l3.72 2.84C6.76 7.3 9.16 5.38 12 5.38z"
      />
      <path fill="none" d="M1 1h22v22H1z" />
    </svg>
  );
}