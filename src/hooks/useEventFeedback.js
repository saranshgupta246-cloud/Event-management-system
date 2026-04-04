import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { normalizeFeedbackSummary } from "../utils/eventFeedback";

let feedbackSummaryUnavailable = false;

export function useMyEventFeedback(eventId, enabled = true) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFeedback = useCallback(async () => {
    if (!enabled || !eventId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/events/${eventId}/feedback/me`);
      if (res.data?.success) {
        setFeedback(res.data.data || null);
      } else {
        setError(res.data?.message || "Unable to load feedback");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setFeedback(null);
        setError("");
      } else {
        setError(err.response?.data?.message || "Unable to load feedback");
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, loading, error, refetch: fetchFeedback };
}

export function useEventFeedbackSummary(eventId, enabled = true) {
  const [summary, setSummary] = useState(() => normalizeFeedbackSummary());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    if (!enabled || !eventId || feedbackSummaryUnavailable) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/events/${eventId}/feedback/summary`);
      if (res.data?.success) {
        setSummary(normalizeFeedbackSummary(res.data.data));
      } else {
        setError(res.data?.message || "Unable to load feedback summary");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 429) {
        feedbackSummaryUnavailable = true;
        setSummary(normalizeFeedbackSummary());
        setError("");
      } else {
        setError(err.response?.data?.message || "Unable to load feedback summary");
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function useEventFeedbackSummaries(eventIds = []) {
  const normalizedIds = useMemo(
    () => Array.from(new Set((Array.isArray(eventIds) ? eventIds : []).filter(Boolean).map(String))),
    [eventIds]
  );
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchSummaries = useCallback(async () => {
    if (normalizedIds.length === 0 || feedbackSummaryUnavailable) {
      setSummaries({});
      return;
    }
    try {
      setLoading(true);
      const results = [];
      for (const id of normalizedIds) {
        try {
          const res = await api.get(`/api/events/${id}/feedback/summary`);
          results.push([id, normalizeFeedbackSummary(res.data?.data)]);
        } catch (err) {
          const status = err.response?.status;
          if (status === 404 || status === 429) {
            feedbackSummaryUnavailable = true;
            break;
          }
          results.push([id, normalizeFeedbackSummary()]);
        }
      }
      setSummaries(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }, [normalizedIds]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return { summaries, loading, refetch: fetchSummaries };
}

export async function saveEventFeedback(eventId, payload, existingFeedback) {
  try {
    const method = existingFeedback?._id ? "put" : "post";
    const res = await api[method](`/api/events/${eventId}/feedback`, payload);
    return res.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Unable to save feedback",
    };
  }
}
