import { useCallback, useEffect, useState } from "react";
import { getNotifications, getUnreadCount, markRead, markAllRead } from "../services/notificationService";

const POLL_INTERVAL_MS = 60_000;

export function useNotifications(options = {}) {
  const { pollInterval = POLL_INTERVAL_MS } = options;
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await getNotifications();
      if (res?.success) {
        setList(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res?.success && res?.data != null) {
        setUnreadCount(res.data.count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const markOneRead = useCallback(async (id) => {
    try {
      await markRead(id);
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAll = useCallback(async () => {
    try {
      await markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      fetchList();
    }
  }, [fetchList]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, pollInterval]);

  return {
    notifications: list,
    unreadCount,
    isLoading,
    error,
    refetch: fetchList,
    fetchUnreadCount,
    markRead: markOneRead,
    markAllRead: markAll,
  };
}
