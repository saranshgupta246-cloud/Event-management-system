import React from "react";
import useAdminEvents from "../../hooks/useAdminEvents";
import EventChatRoom from "../../components/chat/EventChatRoom";
import EventParticipantsPanel from "../../components/chat/EventParticipantsPanel";

export default function AdminChatRoom() {
  const { data, loading, error } = useAdminEvents({ status: "", limit: 100, sort: "eventDate_desc" });
  const events = data?.items || [];
  const [selectedId, setSelectedId] = React.useState(null);

  const selectedEvent = events.find((e) => e._id === selectedId) || events[0] || null;

  React.useEffect(() => {
    if (!selectedId && events.length > 0) {
      setSelectedId(events[0]._id);
    }
  }, [events, selectedId]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-4 lg:gap-6 h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Event Chatrooms
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Choose an event to chat with participants and manage announcements.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 min-h-[480px]">
        {/* Events list */}
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Events
          </h2>

          {loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loading events...
            </p>
          )}
          {error && !loading && (
            <p className="text-xs text-red-500">Unable to load events: {error}</p>
          )}

          <div className="mt-2 flex-1 overflow-y-auto space-y-1">
            {events.map((event) => {
              const active = selectedEvent && selectedEvent._id === event._id;
              return (
                <button
                  key={event._id}
                  type="button"
                  onClick={() => setSelectedId(event._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="truncate">{event.title || "Untitled event"}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {event.status || "upcoming"}
                    </span>
                  </div>
                </button>
              );
            })}
            {!loading && !error && events.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No events found.
              </p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {selectedEvent ? (
            <EventChatRoom event={selectedEvent} />
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">
              Select an event to open its chatroom.
            </div>
          )}
        </div>

        {/* Participants sidebar (hidden on small screens) */}
        {selectedEvent && (
          <div className="hidden xl:block">
            <EventParticipantsPanel event={selectedEvent} />
          </div>
        )}
      </div>
    </div>
  );
}

