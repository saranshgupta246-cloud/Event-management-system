import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { isVisibleToStudents } from "../utils/eventApproval";

export default function useStudentEventDetail(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/events/${eventId}`);
      if (res.data?.success) {
        if (!isVisibleToStudents(res.data.data)) {
          setEvent(null);
          setError("Event not found");
          return;
        }
        setEvent(res.data.data);
      } else {
        setError(res.data?.message || "Event not found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Event not found");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
}
