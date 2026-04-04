import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../services/api";

export default function JoinClubPage() {
  const { slug: clubSegment } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token") || "";

  useEffect(() => {
    let isMounted = true;
    async function fetchClub() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/clubs/${clubSegment}`);
        if (!isMounted) return;
        if (res.data?.success) {
          setClub(res.data.data);
        } else {
          setError(res.data?.message || "Failed to load club");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load club details"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (clubSegment) {
      fetchClub();
    }
    return () => {
      isMounted = false;
    };
  }, [clubSegment]);

  async function handleJoin() {
    if (!token || !clubSegment) {
      setError("Invalid or missing invite token.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const res = await apiClient.post(`/api/clubs/${clubSegment}/join-with-token`, {
        token,
      });
      if (res.data?.success) {
        setSuccess(true);
      } else {
        setError(res.data?.message || "Unable to join club with this invite.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to join club with this invite."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <h1 className="text-lg font-semibold text-amber-900">
            Invite token missing
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            This page must be opened from a valid invite link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back
        </button>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm px-6 py-7 sm:px-8 sm:py-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-4 w-64 rounded bg-slate-100" />
            <div className="h-10 w-32 rounded-full bg-slate-100" />
          </div>
        ) : error && !success ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Joined successfully
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome to {club?.name || "the club"}!
            </h1>
            <p className="text-sm text-slate-600">
              You&apos;re now part of the team. You can view club details and
              upcoming activities from the clubs section in your dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(`/student/clubs/${club?.slug || clubSegment}`)
                }
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Go to Club
              </button>
              <button
                type="button"
                onClick={() => navigate("/student/dashboard")}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-slate-900">
              Join {club?.name || "this club"}
            </h1>
            <p className="text-sm text-slate-600">
              You&apos;ve been invited to join{" "}
              <span className="font-semibold">
                {club?.name || "this club"}
              </span>
              . By accepting this invitation, you&apos;ll become a member and
              start seeing this club in your dashboard.
            </p>
            {club?.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Category: {club.category}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleJoin}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Joining..." : "Accept Invite & Join Club"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/student/dashboard")}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Maybe later
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

