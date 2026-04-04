import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEventParticipants(eventId) {
  const [organizers, setOrganizers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/chat/${eventId}/participants`);
      if (res.data?.success) {
        setOrganizers(res.data.data.organizers || []);
        setAttendees(res.data.data.attendees || []);
      } else {
        setError(res.data?.message || "Unable to load participants");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load participants");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  return { organizers, attendees, loading, error, refetch: load };
}

