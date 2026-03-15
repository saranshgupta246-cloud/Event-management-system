import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, BadgeCheck } from "lucide-react";
import useClubs from "../../hooks/useClubs";
import { PageTitle, BodyText } from "../../components/ui/Typography";

const CATEGORIES = ["All Clubs", "Technical", "Cultural", "Sports", "Social", "Literary", "Research"];

export default function ClubDirectory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Clubs");

  const { items: allClubs, loading, error } = useClubs();

  const filteredClubs = useMemo(() => {
    let list = allClubs;
    if (category !== "All Clubs") {
      list = list.filter((c) => c.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allClubs, search, category]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="flex h-full min-h-screen w-full flex-col overflow-x-hidden">
        <main className="flex flex-1 justify-center px-4 py-10 md:px-20 lg:px-40">
          <div className="flex max-w-[1200px] flex-1 flex-col">
            {/* Title */}
            <div className="mb-8 flex flex-wrap justify-between gap-3">
              <div className="flex min-w-72 flex-col gap-2">
                <PageTitle className="text-3xl sm:text-4xl leading-tight tracking-tight">
                  Club Directory
                </PageTitle>
                <BodyText className="text-base sm:text-lg">
                  Explore 50+ student-led organizations at MITS Gwalior
                </BodyText>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="group flex h-14 w-full min-w-40 flex-col">
              <div className="flex h-full w-full flex-1 items-stretch rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200 transition-all focus-within:ring-2 focus-within:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-center justify-center rounded-l-xl bg-white pl-5 text-slate-400 dark:bg-slate-900">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                  className="form-input flex min-w-0 flex-1 rounded-r-xl border-none bg-slate-50 px-4 text-lg font-normal text-slate-900 placeholder:text-slate-400 focus:outline-0 focus:ring-0 dark:bg-slate-900 dark:text-white"
                    placeholder="Search for club"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </label>
            </div>

            {/* Category filters */}
            <div className="no-scrollbar flex flex-wrap gap-3 overflow-x-auto pb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 transition-all ${
                    category === cat
                     ? "bg-slate-900 text-white shadow-md shadow-slate-800/40 dark:bg-primary dark:text-white dark:shadow-primary/20"
                     : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="text-sm font-medium">{cat}</span>
                </button>
              ))}
            </div>

            {loading && (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading clubs...
              </div>
            )}
            {error && (
              <div className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>
            )}
            {/* Grid */}
            {!loading && !error && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredClubs.map((club) => (
                <div
                  key={club._id || club.id}
                  className="club-card group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div
                      className="h-full w-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${club.logo}")` }}
                      role="img"
                      aria-label={club.name + " logo"}
                    />
                    <div className="visit-button absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:[transform:translateY(0)]" style={{ transform: "translateY(10px)" }}>
                      <Link
                        to={`/student/clubs/${club.slug}`}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
                      >
                        Visit Club Page
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{club.name}</h3>
                    <p className="min-h-[40px] text-sm font-normal leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
                      {club.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                          club.activeEvents > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                        }`}
                      >
                        {club.activeEvents > 0 && (
                          <div className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {club.activeEvents} Active Event{club.activeEvents !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {club.verified && (
                        <BadgeCheck className="h-5 w-5 text-slate-300 dark:text-slate-700" aria-hidden />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
