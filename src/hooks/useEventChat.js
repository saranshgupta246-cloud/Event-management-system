import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { getChatSocket } from "../realtime/chatSocket";

export default function useEventChat(eventId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [chatMode, setChatMode] = useState("leaders_only");
  const [canSend, setCanSend] = useState(false);
  const [canModerate, setCanModerate] = useState(false);

  const loadInitial = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/chat/${eventId}`);
      if (res.data?.success) {
        setMessages(res.data.data.items || []);
        setNextCursor(res.data.data.nextCursor || null);
        if (res.data.data.chatMode) {
          setChatMode(res.data.data.chatMode);
        }
        if (typeof res.data.data.canSend === "boolean") {
          setCanSend(res.data.data.canSend);
        }
        if (typeof res.data.data.canModerate === "boolean") {
          setCanModerate(res.data.data.canModerate);
        }
      } else {
        setError(res.data?.message || "Unable to load chat");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load chat");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadMore = useCallback(async () => {
    if (!eventId || !nextCursor) return;
    try {
      const res = await api.get(`/api/chat/${eventId}`, {
        params: { before: nextCursor },
      });
      if (res.data?.success) {
        const older = res.data.data.items || [];
        setMessages((prev) => [...older, ...prev]);
        setNextCursor(res.data.data.nextCursor || null);
      }
    } catch {
      // ignore for now
    }
  }, [eventId, nextCursor]);

  const sendMessage = useCallback(
    (text) => {
      if (!eventId || !text?.trim()) return;
      const trimmed = text.trim();
      const socket = getChatSocket();
      socket.emit("chat:join", eventId);
      socket.emit("chat:send", { eventId, message: trimmed });
      // Message is created only in the socket handler on the server; "chat:new" broadcasts to all (no REST POST = no duplicate).
    },
    [eventId]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      if (!eventId || !messageId) return;
      try {
        const res = await api.delete(`/api/chat/${eventId}/${messageId}`);
        if (res.data?.success) {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      } catch {
        // silently ignore for now
      }
    },
    [eventId]
  );

  const updateChatMode = useCallback(
    async (mode) => {
      if (!eventId) return;
      try {
        const res = await api.patch(`/api/chat/${eventId}/settings`, { mode });
        if (res.data?.success && res.data.data) {
          if (res.data.data.chatMode) {
            setChatMode(res.data.data.chatMode);
          }
          if (typeof res.data.data.canSend === "boolean") {
            setCanSend(res.data.data.canSend);
          }
          if (typeof res.data.data.canModerate === "boolean") {
            setCanModerate(res.data.data.canModerate);
          }
        }
      } catch (err) {
        // optional: surface error with a toast in caller
        console.error("Failed to update chat mode", err);
      }
    },
    [eventId]
  );

  useEffect(() => {
    if (!eventId) return;

    loadInitial();

    const socket = getChatSocket();
    socket.emit("chat:join", eventId);

    const handler = (msg) => {
      if (!msg?.event || msg.event.toString() !== eventId.toString()) return;
      setMessages((prev) => {
        const id = msg._id?.toString?.() ?? msg._id;
        if (id && prev.some((m) => (m._id?.toString?.() ?? m._id) === id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("chat:new", handler);

    return () => {
      socket.off("chat:new", handler);
    };
  }, [eventId, loadInitial]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    chatMode,
    canSend,
    canModerate,
    updateChatMode,
    loadMore,
    hasMore: !!nextCursor,
  };
}

