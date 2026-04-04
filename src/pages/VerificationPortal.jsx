import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Copy,
  ShieldCheck,
  XCircle as XCircleIcon,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import api from "../services/api";

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VerificationPortal() {
  const { verificationId } = useParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        setIsDark(saved === "dark");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    if (verificationId) {
      setQuery(verificationId);
      handleVerify(verificationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  const handleVerify = async (id) => {
    const trimmed = (id || query).trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setNotFound(false);
    setResult(null);

    try {
      const res = await api.get(`/api/certificates/verify/${encodeURIComponent(trimmed)}`);
      const data = res.data?.data ?? res.data ?? null;
      if (!data) {
        setNotFound(true);
        return;
      }
      setResult(data);
      setNotFound(false);
      if (!verificationId) {
        navigate(`/verify/${encodeURIComponent(trimmed)}`, { replace: false });
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(e.message || "Unable to verify this certificate right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pdfUrl =
    result?.pdfUrl ||
    result?.snapshot?.pdfUrl ||
    result?.certificate?.pdfUrl ||
    "";

  const studentName =
    result?.studentName ||
    result?.recipientName ||
    result?.student?.name ||
    result?.user?.name ||
    "";

  const eventTitle =
    result?.eventTitle ||
    result?.event?.title ||
    result?.snapshot?.eventTitle ||
    "Event";

  const achievementText =
    result?.achievement ||
    result?.snapshot?.achievement ||
    `Successfully completed ${eventTitle} with distinction.`;

  const issuedOn =
    result?.issueDate || result?.issuedAt || result?.createdAt || result?.certificate?.createdAt;

  const certificateId =
    result?.certificateId ||
    result?.verificationId ||
    result?._id ||
    verificationId ||
    query;

  const issuer =
    result?.issuer ||
    result?.issuerName ||
    result?.event?.issuer ||
    result?.event?.clubName ||
    "Madhav Institute of Technology & Science";

  const type =
    result?.type ||
    result?.category ||
    result?.snapshot?.type ||
    "Participation";

  const verifiedCount =
    result?.verifiedCount ||
    result?.metrics?.verifiedCount ||
    result?.stats?.verifiedCount ||
    0;

  const shareId = result?.verificationId || certificateId || "";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${encodeURIComponent(shareId)}`
      : `/verify/${encodeURIComponent(shareId)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener");
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: isDark ? "#0d1117" : "#fafafa",
        color: isDark ? "white" : "rgb(15, 23, 42)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <style>
        {`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.4s ease-out;
          }
        `}
      </style>

      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-40 backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "border-b border-white/10 bg-black/40"
            : "border-b border-black/10 bg-white/90 shadow-[0_1px_20px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold transition-colors duration-300 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                MITS Verification
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Official Certificate Registry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`rounded-full px-4 py-2 transition-colors duration-200 ${
                isDark
                  ? "text-slate-300 hover:bg-white/5 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              â† Back to Home
            </button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDark((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs shadow-sm transition-colors duration-200 ${
                isDark
                  ? "border-white/15 bg-white/10"
                  : "border-black/10 bg-black/10"
              }`}
            >
              {isDark ? (
                <Sun className="h-4.5 w-4.5 text-amber-300" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-500" />
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:inline-flex"
            >
              Admin Login â†’
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section
          ref={heroRef}
          className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 transition-colors duration-300"
          style={{ backgroundColor: isDark ? "#0d1117" : "#fafafa" }}
        >
          {/* Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <motion.div
              className="absolute -left-40 -top-40 h-[500px] w-[500px]"
              style={{
                background:
                  isDark
                    ? "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)"
                    : "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)",
                filter: "blur(2px)",
              }}
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-40 right-[-120px] h-[400px] w-[400px]"
              style={{
                background:
                  isDark
                    ? "radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)"
                    : "radial-gradient(circle, rgba(168,85,247,0.05), transparent 70%)",
                filter: "blur(2px)",
              }}
              animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  isDark
                    ? "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
                    : "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 w-full max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] transition-colors duration-300"
              style={{
                border: isDark
                  ? "1px solid rgba(99,102,241,0.4)"
                  : "1px solid rgba(99,102,241,0.3)",
                backgroundColor: isDark
                  ? "rgba(99,102,241,0.1)"
                  : "rgba(99,102,241,0.06)",
                color: isDark ? "rgb(165 180 252)" : "#6366f1",
              }}
            >
              OFFICIAL CERTIFICATE REGISTRY
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="mt-8 space-y-2"
            >
              <h1
                className={`text-balance font-extrabold leading-tight transition-colors duration-300 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                }}
              >
                Verify Certificate
              </h1>
              <h2
                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text font-extrabold text-transparent"
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                }}
              >
                Authenticity
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
              className={`mx-auto mt-4 max-w-lg text-balance text-lg transition-colors duration-300 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Enter the certificate ID printed on your document to instantly
              verify its authenticity.
            </motion.p>

            {/* Search box */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 24 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
              }
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
              className="mx-auto mt-10 max-w-xl"
            >
              <div
                className="relative"
                style={{
                  borderRadius: 20,
                  padding: isDark ? 2 : 0,
                  border: !isDark
                    ? inputFocused
                      ? "1.5px solid #6366f1"
                      : "1.5px solid #e2e8f0"
                    : undefined,
                  background: isDark
                    ? "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.3))"
                    : "transparent",
                  boxShadow: !isDark
                    ? inputFocused
                      ? "0 0 0 4px rgba(99,102,241,0.1)"
                      : "none"
                    : inputFocused
                      ? "0 0 40px rgba(99,102,241,0.3)"
                      : "none",
                  backgroundImage:
                    isDark && inputFocused
                      ? "linear-gradient(135deg, #6366f1, #a855f7)"
                      : isDark
                        ? "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.3))"
                        : undefined,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  className="flex items-center gap-3 rounded-[18px] px-4 py-2.5 sm:px-5 transition-colors duration-300"
                  style={{
                    backgroundColor: isDark ? "#161f2e" : "#ffffff",
                    boxShadow: !isDark
                      ? "0 2px 20px rgba(0,0,0,0.08)"
                      : "none",
                  }}
                >
                  <span className="flex flex-shrink-0 items-center text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    id="verification-certificate-query"
                    name="verification-certificate-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Enter certificate ID (e.g. MITS-2024-CT-0931)"
                    className={`flex-1 bg-transparent font-mono text-base focus:outline-none sm:text-lg ${
                      isDark
                        ? "text-white placeholder:text-slate-500"
                        : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  <motion.button
                    type="submit"
                    whileHover={{
                      scale: loading ? 1 : 1.03,
                      boxShadow: loading
                        ? "none"
                        : "0 8px 30px rgba(99,102,241,0.4)",
                    }}
                    whileTap={loading ? {} : { scale: 0.97 }}
                    className="ml-2 whitespace-nowrap rounded-[14px] bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg sm:px-8 sm:py-3.5 sm:text-base disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify â†’"}
                  </motion.button>
                </div>
              </div>
              {error && (
                <p className="mt-3 text-xs text-rose-400 sm:text-sm">
                  {error}
                </p>
              )}
            </motion.form>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
              }
              transition={{ duration: 0.5, ease: "easeOut", delay: 1 }}
              className="mt-8 flex flex-wrap justify-center gap-4"
            >
              {[
                "ðŸ›¡ï¸ Blockchain Secured",
                "ðŸ”’ Tamper Proof",
                "ðŸŽ“ Official Record",
              ].map((label) => (
                <motion.div
                  key={label}
                  className={`rounded-full px-4 py-2 text-sm backdrop-blur transition-colors duration-300 ${
                    isDark
                      ? "border border-white/10 bg-white/5 text-slate-300"
                      : "border border-black/10 bg-black/5 text-slate-600"
                  }`}
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Result section */}
          <div className="relative z-10 mx-auto mt-12 w-full max-w-5xl px-4 pb-24">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col items-center justify-center rounded-3xl px-8 py-12 text-center transition-colors duration-300 ${
                    isDark
                      ? "border border-white/5 bg-[#161f2e] text-slate-200"
                      : "border border-slate-200 bg-white text-slate-700 shadow-[0_10px_40px_rgba(15,23,42,0.15)]"
                  }`}
                >
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p
                    className={`mt-4 text-sm transition-colors duration-300 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Verifying certificate...
                  </p>
                </motion.div>
              )}

              {!loading && result && !notFound && (
                <motion.div
                  key="valid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className={`overflow-hidden rounded-3xl transition-colors duration-300 ${
                    isDark
                      ? "border border-indigo-500/40 bg-[#161f2e] shadow-[0_0_60px_rgba(99,102,241,0.18)]"
                      : "border border-[rgba(99,102,241,0.2)] bg-white shadow-[0_20px_60px_rgba(99,102,241,0.08)]"
                  }`}
                >
                  {/* Top banner */}
                  <div
                    className="flex flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:px-8 transition-colors duration-300"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(34,197,94,0.06)",
                      borderBottom: isDark
                        ? "1px solid rgba(16,185,129,0.25)"
                        : "1px solid rgba(34,197,94,0.15)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 items-center justify-center">
                        <span className="absolute h-10 w-10 animate-ping rounded-full bg-emerald-400/30" />
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300">
                          <ShieldCheck className="h-6 w-6" />
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-400">
                          VERIFIED
                        </p>
                        <p
                          className={`text-xs transition-colors duration-300 ${
                            isDark ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          Certificate is authentic and valid
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-[11px] transition-colors duration-300 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Verified on{" "}
                      <span
                        className={`font-medium transition-colors duration-300 ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}
                      >
                        {todayLabel}
                      </span>
                    </p>
                  </div>

                  {/* Main content */}
                  <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                    {/* Left preview */}
                    <div
                      className={`p-6 transition-colors duration-300 md:border-b-0 md:border-r ${
                        isDark ? "border-b border-white/5" : "border-b border-slate-200"
                      }`}
                    >
                      <div className="mx-auto max-w-xs">
                        <div
                          className="aspect-[3/4] overflow-hidden rounded-2xl shadow-inner transition-colors duration-300"
                          style={{
                            backgroundColor: isDark ? "#1e2d42" : "#f8fafc",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          {pdfUrl ? (
                            <iframe
                              title="Certificate Preview"
                              src={pdfUrl}
                              className="h-full w-full border-0"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center text-slate-500">
                              <AwardPlaceholder />
                            </div>
                          )}
                        </div>
                        <p
                          className={`mt-3 text-center text-[10px] font-semibold tracking-[0.24em] transition-colors duration-300 ${
                            isDark ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          DIGITAL CERTIFICATE
                        </p>
                      </div>
                    </div>

                    {/* Right details */}
                    <div className="p-6 sm:p-8">
                      <h2
                        className={`text-2xl font-bold sm:text-3xl transition-colors duration-300 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {studentName || "Recipient"}
                      </h2>
                      <p
                        className={`mt-2 text-sm leading-relaxed transition-colors duration-300 ${
                          isDark ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {achievementText}
                      </p>

                      {/* Details grid */}
                      <div className="mt-6 grid grid-cols-1 gap-4 text-left text-xs sm:grid-cols-2">
                        <div
                          className="rounded-xl px-4 py-3 transition-colors duration-300"
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold tracking-[0.22em]"
                            style={{
                              color: isDark ? "#94a3b8" : "#94a3b8",
                            }}
                          >
                            ISSUE DATE
                          </p>
                          <p
                            className="mt-1 text-sm transition-colors duration-300"
                            style={{
                              color: isDark ? "#ffffff" : "rgb(15, 23, 42)",
                            }}
                          >
                            {formatDate(issuedOn) || "â€”"}
                          </p>
                        </div>
                        <div
                          className="rounded-xl px-4 py-3 transition-colors duration-300"
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold tracking-[0.22em]"
                            style={{
                              color: isDark ? "#94a3b8" : "#94a3b8",
                            }}
                          >
                            CERTIFICATE ID
                          </p>
                          <p
                            className={`mt-1 break-all font-mono text-xs transition-colors duration-300 ${
                              isDark ? "text-slate-100" : "text-slate-900"
                            }`}
                          >
                            {certificateId || "â€”"}
                          </p>
                        </div>
                        <div
                          className="rounded-xl px-4 py-3 transition-colors duration-300"
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold tracking-[0.22em]"
                            style={{
                              color: isDark ? "#94a3b8" : "#94a3b8",
                            }}
                          >
                            ISSUED BY
                          </p>
                          <p
                            className="mt-1 text-sm transition-colors duration-300"
                            style={{
                              color: isDark ? "#ffffff" : "rgb(15, 23, 42)",
                            }}
                          >
                            {issuer}
                          </p>
                        </div>
                        <div
                          className="rounded-xl px-4 py-3 transition-colors duration-300"
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <p
                            className="text-[10px] font-semibold tracking-[0.22em]"
                            style={{
                              color: isDark ? "#94a3b8" : "#94a3b8",
                            }}
                          >
                            TYPE
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                            {String(type).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Verification stats */}
                      <div
                        className="mt-6 rounded-xl px-4 py-3 text-left transition-colors duration-300"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(79,70,229,0.15)"
                            : "rgba(99,102,241,0.04)",
                          border: isDark
                            ? "1px solid rgba(79,70,229,0.4)"
                            : "1px solid rgba(99,102,241,0.12)",
                        }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{
                            color: isDark ? "#a5b4fc" : "#4f46e5",
                          }}
                        >
                          ðŸ” Verified {verifiedCount} time
                          {verifiedCount === 1 ? "" : "s"}
                        </p>
                        <p
                          className={`mt-1 text-[11px] transition-colors duration-300 ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Live verification from the official MITS registry.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 space-y-3 text-left">
                        <motion.button
                          type="button"
                          onClick={handleDownload}
                          disabled={!pdfUrl}
                          whileHover={
                            pdfUrl
                              ? {
                                  scale: 1.02,
                                  boxShadow:
                                    "0 18px 45px rgba(99,102,241,0.5)",
                                }
                              : {}
                          }
                          whileTap={pdfUrl ? { scale: 0.97 } : {}}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
                            pdfUrl
                              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                              : "cursor-not-allowed bg-white/10 text-slate-500"
                          }`}
                        >
                          Download Certificate
                        </motion.button>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors duration-300 ${
                              isDark
                                ? "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                                : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            <Copy className="h-4 w-4" />
                            {copied ? "Link Copied!" : "Share Link"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                "https://www.linkedin.com/",
                                "_blank",
                                "noopener"
                              )
                            }
                            className="flex flex-1 items-center justify-center rounded-xl bg-[#0077B5] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0a66c2]"
                          >
                            Add to LinkedIn
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {!loading && notFound && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`animate-shake rounded-3xl px-6 py-10 text-center sm:px-12 transition-colors duration-300 ${
                    isDark
                      ? "border border-red-500/40 bg-[#161f2e] shadow-[0_0_40px_rgba(239,68,68,0.16)]"
                      : "border border-[rgba(239,68,68,0.2)] bg-white shadow-[0_10px_40px_rgba(239,68,68,0.06)]"
                  }`}
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                    <XCircleIcon className="h-12 w-12" />
                  </div>
                  <h3
                    className={`mt-6 text-2xl font-bold transition-colors duration-300 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Certificate Not Found
                  </h3>
                  <p
                    className={`mt-3 text-sm transition-colors duration-300 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    The ID you entered does not match any certificate in our
                    system.
                  </p>
                  <p
                    className={`mt-2 text-xs transition-colors duration-300 ${
                      isDark ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    Double-check the ID and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                    }}
                    className="mt-8 rounded-full border border-red-500/40 px-8 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`mt-auto px-6 py-8 text-xs transition-colors duration-300 border-t ${
          isDark
            ? "border-white/10 bg-[#080810] text-slate-600"
            : "border-black/10 bg-[#f1f5f9] text-slate-400"
        }`}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                MITS Verification Portal
              </span>
            </div>
            <p className="mt-1 text-[11px]">
              Â© 2024 Madhav Institute of Technology &amp; Science
            </p>
          </div>
          <div className="flex gap-6 text-[11px]">
            <button
              type="button"
              className={`transition-colors duration-200 ${
                isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Privacy
            </button>
            <button
              type="button"
              className={`transition-colors duration-200 ${
                isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Terms
            </button>
            <button
              type="button"
              className={`transition-colors duration-200 ${
                isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Report Issue
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AwardPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <ShieldCheck className="h-12 w-12 text-indigo-400" />
      <p className="mt-3 text-xs font-medium text-slate-400">
        Certificate Preview
      </p>
    </div>
  );
}
