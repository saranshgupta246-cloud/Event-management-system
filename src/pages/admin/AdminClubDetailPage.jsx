import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Users, Briefcase, Building2, ChevronRight, ExternalLink } from "lucide-react";
import api from "../../api/client";
import { resolveEventImageUrl } from "../../utils/eventUrls";
import { getClubLogoPath } from "../../utils/clubStats";
import { clubRouteSegment } from "../../utils/clubRoutes";

function isMongoObjectIdString(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export default function AdminClubDetailPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/clubs/${clubId}`);
        if (res.data?.success && !cancelled) setClub(res.data.data);
        else if (!cancelled) setError(res.data?.message || "Club not found");
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load club");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  useEffect(() => {
    if (!club?.slug || !clubId) return;
    if (!isMongoObjectIdString(clubId)) return;
    if (String(club._id) !== clubId) return;
    navigate(`/admin/clubs/${club.slug}`, { replace: true });
  }, [club, clubId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Club not found"}</p>
        <Link to="/admin/clubs" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/admin/clubs" className="hover:text-slate-900 dark:hover:text-white">
          Clubs
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="font-medium text-slate-900 dark:text-white">{club.name}</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {getClubLogoPath(club) ? (
              <img src={resolveEventImageUrl(getClubLogoPath(club))} alt={club.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{club.name}</h1>
              <p className="text-slate-500 dark:text-slate-400">{club.category}</p>
              {club.description && (
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{club.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to={`/leader/clubs/${clubRouteSegment(club)}/recruitment`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Briefcase className="h-4 w-4" />
            Recruitment
          </Link>
          <Link
            to={`/leader/clubs/${clubRouteSegment(club)}/team`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Users className="h-4 w-4" />
            Team
          </Link>
          <Link
            to={`/admin/clubs/${clubRouteSegment(club)}/preview`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#1e2d42] dark:bg-[#161f2e] dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            View Club
          </Link>
        </div>
      </div>
    </div>
  );
}
