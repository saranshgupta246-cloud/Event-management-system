import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { resolveEventImageUrl } from "../utils/eventUrls";

export default function PublicClubDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/clubs/by-slug/${slug}`);
        if (!alive) return;
        if (res.data?.success) {
          setClub(res.data.data);
        } else {
          setError(res.data?.message || "Club not found");
        }
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || "Club not found");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const handleApplyClick = () => {
    if (!club) return;
    const redirect = encodeURIComponent(
      `/student/clubs/${club.slug || club._id}`
    );
    navigate(`/login?redirect=${redirect}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-sm text-slate-500 dark:text-slate-300">
          Loading club details…
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-sm text-rose-600 dark:text-rose-400">
          {error || "Club not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-[#161f2e] overflow-hidden flex items-center justify-center">
                {club.logoUrl || club.logo ? (
                  <img
                    src={resolveEventImageUrl(club.logoUrl || club.logo)}
                    alt={club.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-500">
                    {club.name?.[0]?.toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {club.name}
                </h1>
                {club.category && (
                  <p className="mt-1 text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {club.category} Club
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark"
            >
              Apply / Join via Portal
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              About the Club
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {club.description || "Details will be updated soon."}
            </p>
            {club.highlightsDriveUrl && (
              <a
                href={club.highlightsDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#161f2e]"
              >
                View Highlights
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

