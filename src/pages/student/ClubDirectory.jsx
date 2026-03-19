import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import useClubs from "../../hooks/useClubs";
import { PageTitle, BodyText } from "../../components/ui/Typography";
import ClubCard from "../../components/clubs/ClubCard";

const CATEGORIES = ["All Clubs", "Technical", "Cultural", "Sports", "Social", "Literary", "Research"];

export default function ClubDirectory() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialCategoryFromUrl = params.get("category");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() =>
    initialCategoryFromUrl && CATEGORIES.includes(initialCategoryFromUrl)
      ? initialCategoryFromUrl
      : "All Clubs"
  );

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
                  <ClubCard key={club._id || club.id} club={club} variant="student" />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
