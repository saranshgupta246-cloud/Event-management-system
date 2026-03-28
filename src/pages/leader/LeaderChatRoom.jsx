import React, { useState, useEffect, useCallback } from "react";
import { Calendar, MessageCircle } from "lucide-react";
import api from "../../api/client";
import EventChatRoom from "../../components/chat/EventChatRoom";
import EventParticipantsPanel from "../../components/chat/EventParticipantsPanel";

export default function LeaderChatRoom() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchClub = useCallback(async () => {
    try {
      const res = await api.get("/api/leader/club");
      if (res.data?.success) {
        setClub(res.data.data);
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchEvents = useCallback(async (clubId) => {
    if (!clubId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/clubs/${clubId}/events`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEvents(res.data.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const clubData = await fetchClub();
      if (!cancelled && clubData?._id) {
        await fetchEvents(clubData._id);
      } else if (!cancelled) {
        setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [fetchClub, fetchEvents]);

  const selectedEvent = events.find((e) => e._id === selectedId) || events[0] || null;

  useEffect(() => {
    if (!selectedId && events.length > 0) {
      setSelectedId(events[0]._id);
    }
  }, [events, selectedId]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-4 lg:gap-6 h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Club Event Chats
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {club ? `Chat with participants in ${club.name}'s events.` : "Chat with participants in your club events."}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 min-h-[480px]">
        {/* Events list */}
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Club Events
          </h2>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            </div>
          )}
          {error && !loading && (
            <p className="text-xs text-red-500">Unable to load events: {error}</p>
          )}

          <div className="mt-2 flex-1 overflow-y-auto space-y-1">
            {!loading && events.map((event) => {
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No club events yet.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Create an event from the Events page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-white dark:bg-background-dark rounded-[18px] border border-slate-200 dark:border-[#1e2d42] shadow-sm overflow-hidden">
          {selectedEvent ? (
            <EventChatRoom event={selectedEvent} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {events.length === 0 
                  ? "Create a club event to start chatting with participants."
                  : "Select an event to open its chatroom."}
              </p>
            </div>
          )}
        </div>

        {/* Participants sidebar */}
        {selectedEvent && (
          <div className="hidden xl:block">
            <EventParticipantsPanel event={selectedEvent} />
          </div>
        )}
      </div>
    </div>
  );
}
