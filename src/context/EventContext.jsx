import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import {
  MOCK_EVENTS,
  MOCK_REGISTRATIONS,
  MOCK_ANNOUNCEMENTS,
} from "../data/eventMockData";
import { useAuth } from "./AuthContext";

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const { user } = useAuth();
  const [events] = useState(MOCK_EVENTS);
  const [registrations, setRegistrations] = useState(MOCK_REGISTRATIONS);
  const [announcements] = useState(MOCK_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(false);

  const getEventBySlug = useCallback(
    (slug) => events.find((e) => e.slug === slug) ?? null,
    [events]
  );

  const getEventById = useCallback(
    (id) => events.find((e) => e.id === id) ?? null,
    [events]
  );

  const getRegistrationsForUser = useCallback(
    (userId) => registrations.filter((r) => r.user_id === userId && r.status === "confirmed"),
    [registrations]
  );

  const getRegistrationsForEvent = useCallback(
    (eventId) => registrations.filter((r) => r.event_id === eventId),
    [registrations]
  );

  const isRegistered = useCallback(
    (userId, eventId) =>
      registrations.some(
        (r) => r.user_id === userId && r.event_id === eventId && r.status === "confirmed"
      ),
    [registrations]
  );

  const getAnnouncementsForEvent = useCallback(
    (eventId) => announcements.filter((a) => a.event_id === eventId),
    [announcements]
  );

  const registerForEvent = useCallback(
    (eventId) =>
      new Promise((resolve) => {
        setLoading(true);
        setTimeout(() => {
          setRegistrations((prev) => [
            ...prev,
            {
              id: `reg-${Date.now()}`,
              user_id: user?.id ?? "user-1",
              event_id: eventId,
              status: "confirmed",
              registered_at: new Date().toISOString(),
              qr_code: `EMS-${eventId}-${user?.id ?? "user-1"}-${user?.student_id ?? "20240912"}`,
            },
          ]);
          setLoading(false);
          resolve();
        }, 400);
      }),
    [user?.id, user?.student_id]
  );

  const cancelRegistration = useCallback((eventId) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.event_id === eventId && r.user_id === (user?.id ?? "user-1")
          ? { ...r, status: "cancelled" }
          : r
      )
    );
  }, [user?.id]);

  const value = useMemo(
    () => ({
      events,
      registrations,
      loading,
      getEventBySlug,
      getEventById,
      getRegistrationsForUser,
      getRegistrationsForEvent,
      isRegistered,
      getAnnouncementsForEvent,
      registerForEvent,
      cancelRegistration,
    }),
    [
      events,
      registrations,
      loading,
      getEventBySlug,
      getEventById,
      getRegistrationsForUser,
      getRegistrationsForEvent,
      isRegistered,
      getAnnouncementsForEvent,
      registerForEvent,
      cancelRegistration,
    ]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
}
