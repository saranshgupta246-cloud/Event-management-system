import React, { useEffect, useState } from "react";
import { auth, googleProvider } from "../../config/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Lock } from "lucide-react";

const ALLOWED_DOMAIN = "mitsgwl.ac.in";
const IS_PRODUCTION = import.meta.env.MODE === "production";
const SUPER_ADMIN_EMAIL = "saranshgupta246@gmail.com";

const ROLE_REDIRECTS = {
  admin: "/admin",
  club_leader: "/leader",
  faculty: "/student",
  student: "/student",
};

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  const messages = [
    { icon: "✨", text: "Manage Events Effortlessly" },
    { icon: "🏆", text: "Track Club Performance" },
    { icon: "📜", text: "Issue Verified Certificates" },
    { icon: "🎓", text: "Built for MITS Community" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email || "";
      const lowerEmail = email.toLowerCase();

      // In production, restrict logins to the official institute domain,
      // but always allow the configured super admin email.
      if (
        IS_PRODUCTION &&
        !lowerEmail.endsWith(`@${ALLOWED_DOMAIN}`) &&
        lowerEmail !== SUPER_ADMIN_EMAIL
      ) {
        await signOut(auth);
        setError(`Please use your official @${ALLOWED_DOMAIN} Google account.`);
        return;
      }

      const idToken = await result.user.getIdToken();

      try {
        const backendRes = await api.post("/api/auth/firebase", { idToken });
        if (backendRes.data?.success) {
          const { token, user } = backendRes.data.data;
          login(user, token);

          let dest = ROLE_REDIRECTS[user.role] || "/student";

          // Always open the admin panel for the super admin email.
          if (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
            dest = "/admin";
          }

          navigate(dest, { replace: true });
          return;
        }

        // If backend rejects but this is the super admin email,
        // still allow a local admin session so you can access the panel.
        if (lowerEmail === SUPER_ADMIN_EMAIL) {
          login(
            {
              id: "super-admin-local",
              email: SUPER_ADMIN_EMAIL,
              role: "admin",
              name: result.user?.displayName || "Super Admin",
            },
            idToken
          );
          navigate("/admin", { replace: true });
          return;
        }

        setError(backendRes.data?.message || "Authentication failed. Try again.");
      } catch (apiErr) {
        const msg = apiErr.response?.data?.message || "Backend unreachable. Using demo mode.";
        console.warn("Backend auth failed:", msg);

        // If backend is unreachable but this is the super admin email,
        // create a local admin session and go to the admin panel.
        if (lowerEmail === SUPER_ADMIN_EMAIL) {
          login(
            {
              id: "super-admin-local",
              email: SUPER_ADMIN_EMAIL,
              role: "admin",
              name: result.user?.displayName || "Super Admin",
            },
            idToken
          );
          navigate("/admin", { replace: true });
          return;
        }

        setError("Could not reach the server. Please check your connection and try again.");
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Unable to sign in with Google right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row">
      {/* Dark / light toggle - global */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsDark((prev) => !prev)}
        className={`fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border text-sm shadow-sm transition ${
          isDark
            ? "border-white/10 bg-white/10 text-white"
            : "border-slate-200 bg-slate-100 text-slate-700"
        }`}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.button>
      {/* Left showcase panel */}
      <div className="relative hidden w-3/5 items-center justify-center overflow-hidden bg-[#0f0f1a] md:flex">
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
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
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
            Madhav Institute of Technology &amp; Science
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
        className={`relative flex w-full flex-col items-center justify-center px-6 py-12 sm:px-8 md:w-2/5 transition-colors duration-300 ${
          isDark ? "bg-[#111118]" : "bg-white"
        }`}
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
            <h2
              className={`text-3xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Welcome back 👋
            </h2>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Sign in to your MITS EMS account
            </p>
          </div>

          {/* Google sign-in */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            className={`mt-10 flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-[15px] font-semibold transition-all ${
              isDark
                ? "border border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10"
                : "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-[0_4px_20px_rgba(15,23,42,0.12)]"
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {loading ? (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                </span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>

          {/* Error */}
          {error && (
            <div
              className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 flex w-full items-center gap-4">
            <div
              className={`h-px flex-1 ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
            <span
              className={`text-xs uppercase tracking-[0.18em] ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              or
            </span>
            <div
              className={`h-px flex-1 ${
                isDark ? "bg-white/10" : "bg-slate-200"
              }`}
            />
          </div>

          {/* Alternative text */}
          <p
            className={`mt-4 text-center text-sm ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Use your <span className="font-semibold">@{ALLOWED_DOMAIN}</span>{" "}
            Google account to access the portal.
          </p>

          {/* Privacy note */}
          <p
            className={`mt-6 flex items-center justify-center gap-2 text-center text-xs ${
              isDark ? "text-slate-600" : "text-slate-400"
            }`}
          >
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
              className={`text-sm font-medium ${
                isDark
                  ? "text-indigo-300 hover:text-indigo-200"
                  : "text-indigo-600 hover:text-indigo-700"
              }`}
            >
              ← Back to Home
            </button>
          </div>

          {/* Copyright */}
          <p
            className={`mt-8 text-center text-[11px] ${
              isDark ? "text-slate-700" : "text-slate-300"
            }`}
          >
            © 2024 MITS Gwalior • All rights reserved
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
