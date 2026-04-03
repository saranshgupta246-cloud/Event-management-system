import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

export default function useAdminStudents({ search, department, year, page = 1, limit = 20 }) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/students", {
        params: { search, department, year, page, limit },
      });
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || "Unable to load students");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  }, [search, department, year, page, limit]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { data, loading, error, refetch: fetchStudents };
}

export async function updateAdminStudent(id, updates) {
  const res = await api.put(`/api/admin/students/${id}`, updates);
  return res.data;
}

export async function exportAdminStudentsCsv({ search, department, year } = {}) {
  try {
    const res = await api.get("/api/admin/students/export.csv", {
      params: { search, department, year },
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Unable to export CSV",
    };
  }
}

