import React, { useState } from "react";
import useEventParticipants from "../../hooks/useEventParticipants";

export default function EventParticipantsPanel({ event }) {
  const eventId = event?._id;
  const { organizers, attendees, loading, error } = useEventParticipants(eventId);
  const [query, setQuery] = useState("");

  const norm = (v) => (v || "").toLowerCase();
  const filteredOrganizers = organizers.filter((p) =>
    norm(p.name).includes(norm(query))
  );
  const filteredAttendees = attendees.filter((p) =>
    norm(p.name).includes(norm(query))
  );

  return (
    <aside className="w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-[#1e2d42] bg-slate-50 dark:bg-background-dark flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-[#1e2d42]">
        <h3 className="text-sm font-bold mb-3">Participants</h3>
        <label htmlFor={eventId ? `participants-search-${eventId}` : "participants-search"} className="flex items-center bg-white dark:bg-[#161f2e] border border-slate-200 dark:border-[#1e2d42] rounded-lg px-3 py-1.5">
          <span className="material-symbols-outlined text-slate-400 text-lg">
            search
          </span>
          <input
            id={eventId ? `participants-search-${eventId}` : "participants-search"}
            name={eventId ? `participants-search-${eventId}` : "participants-search"}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search participants..."
            className="bg-transparent border-none focus:ring-0 text-xs w-full placeholder:text-slate-400"
          />
        </label>
        {loading && (
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Loading participants...
          </p>
        )}
        {error && !loading && (
          <p className="mt-2 text-[11px] text-red-500">{error}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Organizers group */}
        {filteredOrganizers.length > 0 && (
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Organizers — {filteredOrganizers.length}
            </h4>
            <div className="flex flex-col gap-3">
              {filteredOrganizers.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-8"
                        style={{
                          backgroundImage: p.avatar
                            ? `url('${p.avatar}')`
                            : "linear-gradient(135deg,#0d1117,#161f2e)",
                        }}
                        aria-label={p.name}
                      />
                      <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-[#0d1117] rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{p.name}</span>
                      <span className="text-[10px] text-primary">
                        {p.role === "faculty"
                          ? "Faculty"
                          : p.role === "faculty_coordinator"
                          ? "Faculty Coordinator"
                          : "Organizer"}
                      </span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-primary">
                    <span className="material-symbols-outlined text-base">
                      more_horiz
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attendees group */}
        {filteredAttendees.length > 0 && (
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Attendees — {filteredAttendees.length}
            </h4>
            <div className="flex flex-col gap-3">
              {filteredAttendees.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="bg-center bg-no-repeat bg-cover rounded-full size-8"
                      style={{
                        backgroundImage: p.avatar
                          ? `url('${p.avatar}')`
                          : "linear-gradient(135deg,#161f2e,#0d1117)",
                      }}
                      aria-label={p.name}
                    />
                    <span className="text-xs font-medium">{p.name}</span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                    <span className="material-symbols-outlined text-base">
                      block
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading &&
          !error &&
          filteredOrganizers.length === 0 &&
          filteredAttendees.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No participants yet.
            </p>
          )}
      </div>

      {/* Invite button hidden for now until a full invite flow is designed */}
    </aside>
  );
}

