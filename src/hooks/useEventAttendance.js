import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

export default function useEventAttendance(eventId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(
    async (overrideId) => {
      const targetId = overrideId || eventId;
      if (!targetId) return;

      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/attendance/event/${targetId}`);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || "Unable to load attendance");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    if (eventId) {
      fetchAttendance(eventId);
    }
  }, [eventId, fetchAttendance]);

  return {
    data,
    loading,
    error,
    refetch: fetchAttendance,
  };
}

export async function scanAttendance(qrCodeToken) {
  try {
    const res = await api.post("/api/attendance/scan", { qrCodeToken });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || "Unable to scan attendance";
    return { success: false, message: msg };
  }
}

export async function manualMarkAttendance(registrationId) {
  try {
    const res = await api.put(`/api/attendance/manual/${registrationId}`);
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message || "Unable to update attendance manually";
    return { success: false, message: msg };
  }
}

export async function exportAttendanceCsv(eventId) {
  try {
    const res = await api.get(`/api/attendance/export/${eventId}`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance-${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (err) {
    const msg = err.response?.data?.message || "Unable to export CSV";
    return { success: false, message: msg };
  }
}

