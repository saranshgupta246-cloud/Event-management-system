import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      let url = "/api/notifications";
      if (user?.role === "admin") {
        url += "?scope=admin-all";
      }
      const res = await api.get(url);
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch {
      // Silently fail — keeps UI working even if backend is down
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.post(`/api/notifications/${id}/read`);
    } catch {
      // revert on failure
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.post("/api/notifications/read-all");
    } catch {
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const addNotification = useCallback(
    async ({ title, message, audience = "all", pinned = false, expiresAt }) => {
      try {
        const res = await api.post("/api/notifications", {
          title,
          message,
          audience,
          pinned,
          // Only send expiresAt for unpinned announcements; backend will default unpinned to 24h when missing.
          expiresAt: pinned ? undefined : expiresAt,
        });
        if (res.data?.success) {
          await fetchNotifications();
          return res.data.data;
        }
      } catch {
        // Fallback: add locally if backend unavailable
        const local = {
          _id: `local-${Date.now()}`,
          title: title || "Announcement",
          message: message || "",
          audience,
          pinned,
          expiresAt: pinned ? null : expiresAt || null,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((prev) => [local, ...prev]);
        setUnreadCount((c) => c + 1);
        return local;
      }
    },
    [fetchNotifications]
  );

  const deleteNotification = useCallback(
    async (id) => {
      if (!id) return;
      // optimistic remove
      setNotifications((prev) => {
        const next = prev.filter((n) => n._id !== id);
        const wasUnread = prev.some((n) => n._id === id && !n.isRead);
        if (wasUnread) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return next;
      });
      try {
        await api.delete(`/api/notifications/${id}`);
      } catch {
        // rollback on failure
        await fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      addNotification,
      refetch: fetchNotifications,
      // Legacy compat for AdminAnnouncement
      getNotificationsForUser: () => notifications,
      deleteNotification,
    }),
    [notifications, unreadCount, loading, markRead, markAllRead, addNotification, deleteNotification, fetchNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markRead: () => {},
      markAllRead: () => {},
      addNotification: () => {},
      refetch: () => {},
      getNotificationsForUser: () => [],
      deleteNotification: () => {},
    };
  }
  return ctx;
}
