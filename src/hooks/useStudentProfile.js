import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

export default function useStudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/profile/me");
      if (res.data?.success) {
        setProfile(res.data.data);
      } else {
        setError(res.data?.message || "Unable to load profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    try {
      setError(null);
      const res = await api.put("/api/profile/me", payload);
      if (res.data?.success) {
        setProfile(res.data.data);
      } else {
        setError(res.data?.message || "Unable to update profile");
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to update profile";
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  /**
   * Upload a File object to Cloudinary via the backend proxy.
   * Returns { url: string } on success or { error: string } on failure.
   */
  const uploadAvatar = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/api/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        // Optimistically update local state
        setProfile((prev) => prev ? { ...prev, avatar: res.data.url } : prev);
        return { url: res.data.url };
      }
      return { error: res.data?.message || "Upload failed." };
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed.";
      return { error: msg };
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, fetchProfile, updateProfile, uploadAvatar };
}
