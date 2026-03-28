import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner as QrScanner } from "@yudiel/react-qr-scanner";
import { QrCode, Camera, CameraOff, Sparkles } from "lucide-react";

function playSuccessSound() {
  try {
    const audio = new Audio("/sounds/success.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {
    // ignore missing audio or browser restrictions
  }
}

function extractToken(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0];
    return (
      first?.rawValue ||
      first?.text ||
      first?.value ||
      (typeof first === "string" ? first : "") ||
      ""
    );
  }
  return payload.rawValue || payload.text || payload.value || "";
}

export default function QRScannerCard({ disabled, onSubmitToken, isSubmitting }) {
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scanToken, setScanToken] = useState("");
  const [scanMessage, setScanMessage] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);
  const [isCameraBusy, setIsCameraBusy] = useState(false);

  useEffect(() => {
    if (disabled) {
      setScannerEnabled(false);
    }
  }, [disabled]);

  const handleSubmitToken = useCallback(
    async (token) => {
      if (!onSubmitToken) return;
      const trimmed = String(token || "").trim();
      if (!trimmed || isSubmitting) return;

      setScanMessage(null);
      setScanError(null);

      const res = await onSubmitToken(trimmed);
      if (res?.success) {
        setScanToken("");
        setScanMessage(res.message || "Checked in successfully.");
        setShowSuccessPulse(true);
        playSuccessSound();
        setTimeout(() => setShowSuccessPulse(false), 700);
      } else if (res?.message) {
        setScanError(res.message);
      } else {
        setScanError("Unable to process QR token.");
      }
    },
    [onSubmitToken, isSubmitting]
  );

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!scanToken.trim()) return;
    await handleSubmitToken(scanToken);
  };

  const handleCameraScan = async (payload) => {
    if (isCameraBusy || isSubmitting || disabled) return;
    const token = extractToken(payload);
    if (!token) return;
    setIsCameraBusy(true);
    await handleSubmitToken(token);
    setIsCameraBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161f2e] p-6 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            QR Scanner
          </p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Scan attendee QR codes or paste the token manually.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-200">
          <QrCode className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 dark:border-[#1e2d42] dark:bg-[#161f2e]/60">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-slate-900/90">
            <AnimatePresence>
              {scannerEnabled && !disabled ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full"
                >
                  <QrScanner
                    constraints={{ facingMode: "environment" }}
                    formats={["qr_code"]}
                    onScan={handleCameraScan}
                    onError={(err) => {
                      const msg = err?.message || "Unable to access camera";
                      setScannerError(msg);
                    }}
                    styles={{ container: { width: "100%", height: "100%" } }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-100 shadow-lg">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-100">
                    Camera scanner is idle
                  </p>
                  <p className="max-w-xs text-[11px] text-slate-400">
                    Start the scanner to capture QR codes directly from attendee devices.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSuccessPulse && (
                <motion.div
                  key="success-highlight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.25 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 bg-emerald-400 mix-blend-screen"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              onClick={() => {
                if (disabled) return;
                setScannerError(null);
                setScannerEnabled((prev) => !prev);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold shadow-sm transition ${
                disabled
                  ? "cursor-not-allowed bg-slate-800/40 text-slate-500"
                  : "bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              }`}
            >
              {scannerEnabled && !disabled ? (
                <>
                  <CameraOff className="h-3.5 w-3.5" />
                  Stop Scanner
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Start Scanner
                </>
              )}
            </motion.button>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {disabled
                ? "Load an event first to enable scanning."
                : isCameraBusy || isSubmitting
                ? "Processing scan..."
                : "Ready to scan QR codes."}
            </p>
          </div>

          {scannerError && (
            <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{scannerError}</p>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label htmlFor="qr-manual-token" className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Manual QR Token
            <span className="ml-1 text-[11px] font-normal text-slate-400">
              (fallback)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              id="qr-manual-token"
              name="qr-manual-token"
              type="text"
              value={scanToken}
              onChange={(e) => setScanToken(e.target.value)}
              placeholder="Scan or paste QR token here"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-50 dark:focus:border-emerald-400 dark:focus:bg-slate-900 dark:focus:ring-emerald-900/40"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: scanToken.trim() ? 1.02 : 1 }}
              whileTap={{ scale: scanToken.trim() ? 0.97 : 1 }}
              disabled={!scanToken.trim() || isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <QrCode className="h-4 w-4" />
            </motion.button>
          </div>
        </form>

        <div className="space-y-1">
          {isSubmitting && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Submitting scan and refreshing stats...
            </p>
          )}
          {scanMessage && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{scanMessage}</p>
          )}
          {scanError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{scanError}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

