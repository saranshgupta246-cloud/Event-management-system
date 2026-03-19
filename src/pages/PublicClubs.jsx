import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import useClubs from "../hooks/useClubs";
import ClubCard from "../components/clubs/ClubCard";

export default function PublicClubs() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialCategoryFromUrl = params.get("category") || "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategoryFromUrl);

  const { items: allClubs, loading, error } = useClubs({
    search,
    category,
  });

  const filteredClubs = useMemo(() => {
    // Backend already filters by category; here we only apply a client-side text search.
    let list = allClubs;
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
  }, [allClubs, search]);

  const headingCategory = category || "All Clubs";

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="flex h-full min-h-screen w-full flex-col overflow-x-hidden">
        <main className="flex flex-1 justify-center px-4 py-10 md:px-20 lg:px-40">
          <div className="flex max-w-[1200px] flex-1 flex-col">
            <div className="mb-8 flex flex-wrap justify-between gap-3">
              <div className="flex min-w-72 flex-col gap-2">
                <h1 className="text-3xl sm:text-4xl leading-tight tracking-tight font-extrabold">
                  {headingCategory === "All Clubs"
                    ? "Explore Clubs"
                    : `${headingCategory} Clubs`}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
                  Browse campus communities and discover clubs that match your interests.
                </p>
              </div>
            </div>

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

            {loading && (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading clubs...
              </div>
            )}
            {error && (
              <div className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredClubs.map((club) => (
                  <ClubCard key={club._id || club.id} club={club} variant="public" />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

