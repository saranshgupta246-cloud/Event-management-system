import { io } from "socket.io-client";

let socketInstance = null;

export function getChatSocket() {
  if (socketInstance) return socketInstance;

  const token = localStorage.getItem("ems_token");
  socketInstance = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
    auth: { token },
  });

  return socketInstance;
}

export function disconnectChatSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

