import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Grid2X2,
  Terminal,
  Palette,
  Trophy,
  Megaphone,
  Check,
  Award,
} from "lucide-react";
import { useRecruitmentDrives } from "../../hooks/useRecruitmentDrives";
import { useMyApplications } from "../../hooks/useMyApplications";
import ApplyModal from "../../components/recruitment/ApplyModal";
import { CATEGORY_COLORS, CATEGORY_ACCENT } from "../../config/statusTokens";

const CATEGORY_FILTERS = [
  { id: null, label: "All Drives", icon: Grid2X2 },
  { id: "Technical", label: "Tech Clubs", icon: Terminal },
  { id: "Cultural", label: "Cultural Clubs", icon: Palette },
  { id: "Sports", label: "Sports Clubs", icon: Trophy },
  { id: "Marketing", label: "Marketing", icon: Megaphone },
];

function DriveCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="mt-2 h-5 w-32 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </div>
      <div className="mt-3 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-14 rounded-full bg-slate-200" />
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex -space-x-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-6 w-6 rounded-full bg-slate-200" />
        </div>
        <div className="h-9 w-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

function DriveCard({ drive, hasApplied, onApply }) {
  const category = drive.clubId?.category || "Technical";
  const accentColor = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.Technical;
  const daysLeft = drive.daysLeft;
  const isClosed = drive.status === "closed" || (daysLeft !== null && daysLeft <= 0);
  const isUrgent = daysLeft !== null && daysLeft <= 2;
  const isSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 2;
  const clubName = drive.clubId?.name || "Club";
  const logoUrl = drive.clubId?.logoUrl;
  const initials = clubName.slice(0, 2).toUpperCase();
  const skills = drive.requiredSkills || [];
  const showSkills = skills.slice(0, 3);
  const moreSkills = skills.length > 3 ? skills.length - 3 : 0;
  const applicantCount = drive.applicantCount ?? 0;

  const deadlineBadge = () => {
    if (isClosed) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-500">
          CLOSED
        </span>
      );
    }
    if (isUrgent) {
      return (
        <span className="inline-flex items-center gap-1.5 animate-pulse rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          ENDS IN {daysLeft} DAY{daysLeft === 1 ? "" : "S"}
        </span>
      );
    }
    if (isSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-amber-700">
          {daysLeft} DAYS LEFT
        </span>
      );
    }
    if (daysLeft !== null) {
      return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-600">
          {daysLeft} DAYS LEFT
        </span>
      );
    }
    return null;
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => !isClosed && !hasApplied && onApply(drive)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isClosed && !hasApplied) onApply(drive);
      }}
      className="relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{
          backgroundColor: accentColor,
          borderRadius: "16px 16px 0 0",
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{clubName}</p>
          </div>
        </div>
        {deadlineBadge()}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-tight text-slate-900">{drive.roleTitle}</h3>
      <span
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: `${CATEGORY_COLORS[category] || CATEGORY_COLORS.Technical}1A`,
          color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Technical,
        }}
      >
        {category}
      </span>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{drive.description}</p>
      {showSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {showSkills.map((skill, i) => (
            <span
              key={i}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
          {moreSkills > 0 && (
            <span className="text-xs text-slate-400">+{moreSkills} more</span>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 ring-2 ring-white"
                aria-hidden
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-slate-500">+{applicantCount} applied</span>
        </div>
        {hasApplied ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" />
            Applied ✓
          </span>
        ) : isClosed ? (
          <span className="cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
            Closed
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApply(drive);
            }}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)] transition-all hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.4)]"
          >
            Apply
          </button>
        )}
      </div>
    </article>
  );
}

export default function StudentRecruitmentPage() {
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const { drives, loading, error, refetch } = useRecruitmentDrives({
    category,
    search: searchDebounced,
    status: "open",
    page: 1,
    limit: 24,
  });

  const { stats, applications, refetch: refetchApplications } = useMyApplications();
  const appliedDriveIds = useMemo(
    () => new Set((applications || []).map((a) => a.driveId?._id?.toString()).filter(Boolean)),
    [applications]
  );

  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const location = useLocation();
  React.useEffect(() => {
    if (location.state?.applied) {
      refetchApplications();
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state?.applied, refetchApplications, location.pathname]);

  const handleApply = (drive) => {
    setApplyModalDrive(drive);
  };

  const handleClearFilters = () => {
    setCategory(null);
    setSearch("");
  };

  const hasActiveFilters = category != null || search.trim() !== "";

  const [applyModalDrive, setApplyModalDrive] = useState(null);
  const handleApplyClose = () => {
    setApplyModalDrive(null);
  };
  const handleApplySuccess = () => {
    refetchApplications();
    setApplyModalDrive(null);
  };

  return (
    <div
      className="relative min-h-screen font-sans"
      style={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 60%, #F0FDF4 100%)",
      }}
    >
      <div
        className="pointer-events-none fixed z-0 h-[600px] w-[600px] rounded-full"
        style={{
          top: -200,
          right: -200,
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar - hidden on mobile, shown as horizontal chips on md */}
        <aside className="hidden w-[260px] shrink-0 flex-col gap-6 border-r border-slate-200 bg-white/95 p-4 md:flex md:sticky md:top-0 md:h-screen">
          <h2 className="text-sm font-semibold text-slate-800">Browse Drives</h2>
          <nav className="flex flex-col gap-0.5">
            {CATEGORY_FILTERS.map((f) => {
              const Icon = f.icon;
              const active = category === f.id;
              return (
                <button
                  key={f.id ?? "all"}
                  type="button"
                  onClick={() => setCategory(f.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                    active
                      ? "border-l-2 border-primary-600 bg-primary-50 font-medium text-primary-700 -ml-0.5 pl-3"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="my-4 border-t border-slate-100" />
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
              borderRadius: 16,
            }}
          >
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Your Progress</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Applied</span>
                <span className="font-bold text-slate-800">{stats.applied}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Interviews</span>
                <span className="flex items-center gap-1 font-bold text-primary-600">
                  {stats.interviews}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Offers</span>
                <span className="flex items-center gap-1 font-bold text-green-600">
                  {stats.offers}
                  <Award className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          {/* Mobile: horizontal filter chips + progress bar */}
          <div className="mb-4 flex flex-col gap-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORY_FILTERS.map((f) => {
                const Icon = f.icon;
                const active = category === f.id;
                return (
                  <button
                    key={f.id ?? "all"}
                    type="button"
                    onClick={() => setCategory(f.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      active ? "bg-primary-50 text-primary-700" : "bg-white text-slate-600 shadow-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center justify-around rounded-xl border border-slate-200 bg-white/90 p-3 backdrop-blur-sm"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{stats.applied}</p>
                <p className="text-xs text-slate-500">Applied</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary-600">{stats.interviews}</p>
                <p className="text-xs text-slate-500">Interviews</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{stats.offers}</p>
                <p className="text-xs text-slate-500">Offers</p>
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search roles, clubs, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-sm outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <p className="mb-4 text-sm text-slate-500">
            Showing {loading ? "..." : drives.length} open position{drives.length !== 1 ? "s" : ""}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <DriveCardSkeleton key={i} />
              ))}
            </div>
          ) : drives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-slate-300" aria-hidden />
              <p className="mt-4 text-xl font-semibold text-slate-600">No drives found</p>
              <p className="mt-1 text-sm text-slate-400">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {drives.map((drive) => (
                <DriveCard
                  key={drive._id}
                  drive={drive}
                  hasApplied={appliedDriveIds.has(drive._id?.toString())}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <ApplyModal
        isOpen={!!applyModalDrive}
        onClose={handleApplyClose}
        drive={applyModalDrive}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
