import { useState } from "react";
import api from "../api/client";

export default function useRegisterEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = async (eventId, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        eventId,
        registrationType: options.registrationType || "solo",
      };
      if (options.teamName) payload.teamName = options.teamName;
      if (Array.isArray(options.teammates)) payload.teammates = options.teammates;
      if (options.utrNumber) {
        payload.utrNumber = options.utrNumber;
      }
      const res = await api.post("/api/registrations", payload);
      if (res.data?.success) {
        return { success: true, data: res.data.data };
      }
      const msg = res.data?.message || "Registration failed";
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}
