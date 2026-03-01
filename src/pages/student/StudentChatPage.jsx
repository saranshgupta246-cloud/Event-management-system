import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useMyRegistrations from "../../hooks/useMyRegistrations";
import EventChatRoom from "../../components/chat/EventChatRoom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function StudentChatPage() {
  const { items, loading, error } = useMyRegistrations();
  const query = useQuery();
  const navigate = useNavigate();

  const confirmed = items.filter((reg) => reg.status !== "cancelled");

  const initialEventIdFromQuery = query.get("eventId");
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    if (initialEventIdFromQuery && confirmed.length > 0) {
      const exists = confirmed.some(
        (reg) => reg.event?._id === initialEventIdFromQuery
      );
      if (exists) {
        setSelectedEventId(initialEventIdFromQuery);
        return;
      }
    }
    if (!selectedEventId && confirmed.length > 0) {
      setSelectedEventId(confirmed[0].event?._id || null);
    }
  }, [initialEventIdFromQuery, confirmed, selectedEventId]);

  const activeRegistration =
    confirmed.find((reg) => reg.event?._id === selectedEventId) || null;
  const activeEvent = activeRegistration?.event || null;

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    const params = new URLSearchParams();
    if (eventId) {
      params.set("eventId", eventId);
    }
    navigate(`/student/chat?${params.toString()}`, { replace: true });
  };

  if (loading && items.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-slate-800 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2 animate-pulse">
            hourglass_empty
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading your chatrooms...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !error && confirmed.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-slate-800 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
            forum
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            No active event chatrooms yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Register for an event to join its chatroom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-slate-100 min-h-[calc(100vh-64px)] flex flex-col rounded-xl overflow-hidden border border-[#e7edf3] dark:border-slate-800">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation - Registered Events */}
        <aside className="w-80 border-r border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-background-dark hidden lg:flex flex-col">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col">
              <h1 className="text-[#0d141b] dark:text-slate-100 text-base font-bold leading-normal">
                Registered Events
              </h1>
              <p className="text-[#4c739a] text-sm font-normal leading-normal">
                Active chatrooms
              </p>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-250px)]">
              {confirmed.map((reg) => {
                const event = reg.event || {};
                const isActive = event._id === selectedEventId;

                return (
                  <button
                    key={reg._id}
                    type="button"
                    onClick={() => handleSelectEvent(event._id)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-left cursor-pointer transition-colors group ${
                      isActive
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`text-[#4c739a] group-hover:text-[#0d141b] dark:group-hover:text-slate-100`}
                    >
                      <span className="material-symbols-outlined">
                        terminal
                      </span>
                    </div>
                    <p
                      className={`text-sm font-medium leading-normal ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-[#0d141b] dark:text-slate-300"
                      }`}
                    >
                      {event.title || "Event"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-background-light dark:bg-slate-900 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white dark:bg-background-dark border-b border-[#e7edf3] dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h2 className="text-[#0d141b] dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em]">
                {activeEvent?.title || "Select an event chat"}
              </h2>
              {activeEvent && (
                <div className="flex gap-3 pt-2">
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-primary/10 px-3 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-lg">
                      check_circle
                    </span>
                    <p className="text-primary text-xs font-bold uppercase tracking-wider">
                      Registered
                    </p>
                  </div>
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-[#e7edf3] dark:bg-slate-800 px-3">
                    <span className="material-symbols-outlined text-[#4c739a] text-lg">
                      person
                    </span>
                    <p className="text-[#0d141b] dark:text-slate-300 text-xs font-medium">
                      {confirmed.length} Active Members
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Chat */}
          <div className="flex-1 overflow-hidden">
            {activeEvent ? (
              <EventChatRoom event={activeEvent} hideHeader />
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">
                Select a registered event from the left to open its chatroom.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

