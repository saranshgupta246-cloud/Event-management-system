import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

export default function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/departments");
      if (res.data?.success) {
        setDepartments(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setError(res.data?.message || "Failed to load departments");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { departments, loading, error, refetch: fetch };
}

export async function createDepartment(payload) {
  const res = await api.post("/api/departments", payload);
  return res.data;
}

export async function updateDepartment(id, payload) {
  const res = await api.put(`/api/departments/${id}`, payload);
  return res.data;
}

export async function deleteDepartment(id) {
  const res = await api.delete(`/api/departments/${id}`);
  return res.data;
}

