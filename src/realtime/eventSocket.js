import { io } from "socket.io-client";

let eventSocketInstance = null;

export function getEventSocket() {
  if (eventSocketInstance) return eventSocketInstance;

  const token = localStorage.getItem("ems_token");
  eventSocketInstance = io(
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    }
  );

  return eventSocketInstance;
}

export function disconnectEventSocket() {
  if (eventSocketInstance) {
    eventSocketInstance.disconnect();
    eventSocketInstance = null;
  }
}

