import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import { getEventSocket } from "../realtime/eventSocket";
import { isVisibleToStudents } from "../utils/eventApproval";

export default function useStudentEvents({ search = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const realtimeTimerRef = useRef(null);

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const params = search.trim() ? { search } : {};
      const res = await api.get("/api/events", { params });
      if (res.data?.success) {
        const events = Array.isArray(res.data.data) ? res.data.data : [];
        setItems(events.filter(isVisibleToStudents));
      } else {
        setError(res.data?.message || "Unable to load events");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError(
          "You're making requests too quickly. Please wait a moment and try again."
        );
      } else {
        setError(err.response?.data?.message || "Unable to load events");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const socket = getEventSocket();
    if (!socket) return undefined;

    const onEventsChanged = () => {
      if (realtimeTimerRef.current) {
        window.clearTimeout(realtimeTimerRef.current);
      }
      realtimeTimerRef.current = window.setTimeout(() => {
        fetchEvents({ silent: true });
      }, 250);
    };

    socket.on("events:changed", onEventsChanged);

    return () => {
      socket.off("events:changed", onEventsChanged);
      if (realtimeTimerRef.current) {
        window.clearTimeout(realtimeTimerRef.current);
        realtimeTimerRef.current = null;
      }
    };
  }, [fetchEvents]);

  return { items, loading, error, refetch: fetchEvents };
}
