import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";

export default function ClubCard({ club, variant = "student" }) {
  const baseClasses =
    "club-card group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900";

  const logoUrl = club.logo || club.logoUrl || "";
  const activeEvents = club.activeEvents ?? club.openDrivesCount ?? 0;
  const verified = !!club.verified;

  const overlayLink =
    variant === "public"
      ? `/clubs/${club.slug || club._id}`
      : `/student/clubs/${club.slug || club._id}`;

  const overlayLabel = variant === "public" ? "View Club Details" : "Visit Club Page";

  return (
    <div key={club._id || club.id} className={baseClasses}>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: logoUrl ? `url("${logoUrl}")` : undefined }}
          role="img"
          aria-label={(club.name || "") + " logo"}
        />
        <div
          className="visit-button absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:[transform:translateY(0)]"
          style={{ transform: "translateY(10px)" }}
        >
          <Link
            to={overlayLink}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            {overlayLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {club.name}
        </h3>
        <p className="min-h-[40px] text-sm font-normal leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
          {club.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
              activeEvents > 0
                ? "bg-primary/10 text-primary"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            }`}
          >
            {activeEvents > 0 && (
              <div className="size-2 rounded-full bg-primary animate-pulse" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeEvents} Active Event{activeEvents !== 1 ? "s" : ""}
            </span>
          </div>
          {verified && (
            <BadgeCheck
              className="h-5 w-5 text-slate-300 dark:text-slate-700"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}

