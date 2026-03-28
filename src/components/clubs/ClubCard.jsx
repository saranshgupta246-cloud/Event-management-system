import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { resolveEventImageUrl } from "../../utils/eventUrls";

function formatCategory(category) {
  if (!category || typeof category !== "string") return "";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export default function ClubCard({ club, variant = "student" }) {
  const baseClasses =
    "club-card group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-[#1e2d42] dark:bg-[#161f2e]";

  const rawLogo = club.logo || club.logoUrl || "";
  const logoUrl = rawLogo ? resolveEventImageUrl(rawLogo) : "";
  const verified = !!club.verified;
  const id = club._id || club.id;

  const detailPath =
    variant === "public"
      ? `/clubs/${club.slug || id}`
      : `/student/clubs/${club.slug || id}`;

  const categoryLabel = formatCategory(club.category);

  return (
    <Link
      to={detailPath}
      className={`${baseClasses} block text-slate-900 no-underline dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-[#161f2e]">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined }}
          role="img"
          aria-label={(club.name || "") + " logo"}
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {club.name}
        </h3>
        {categoryLabel && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {categoryLabel}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors group-hover:bg-primary-700">
            View Club
          </span>
          {verified && (
            <BadgeCheck
              className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-700"
              aria-hidden
            />
          )}
        </div>
      </div>
    </Link>
  );
}
