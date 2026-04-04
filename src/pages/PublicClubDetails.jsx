import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { resolveEventImageUrl } from "../utils/eventUrls";

function PublicHeader({ navigate }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#e5edf9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src="/images/mits-logo-main.png" alt="MITS" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-extrabold text-blue-900 text-lg">MITS-DU GWALIOR</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-blue-500 transition-all"
        >
          PORTAL LOGIN
        </button>
      </div>
    </nav>
  );
}

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <PublicHeader navigate={navigate} />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-sm text-slate-500 dark:text-slate-300">
            Loading club detailsâ€¦
          </div>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <PublicHeader navigate={navigate} />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-sm text-rose-600 dark:text-rose-400">
            {error || "Club not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <PublicHeader navigate={navigate} />
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

