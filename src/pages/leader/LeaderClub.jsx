import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { UsersRound, Calendar, Users, Pencil, AlertCircle, X, Upload, Loader2 } from "lucide-react";
import api from "../../api/client";

const CATEGORIES = [
  { value: "technical", label: "Technical" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "literary", label: "Literary" },
  { value: "other", label: "Other" },
];

export default function LeaderClub() {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchClub = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/leader/club");
      if (res.data?.success) {
        setClub(res.data.data);
      } else {
        setError(res.data?.message || "Unable to load club");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load club");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center text-center gap-3 dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Club not available</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || "You are not currently assigned as a club leader. Once a club is linked to your account, its details will appear here."}
          </p>
        </div>
      </div>
    );
  }

  const memberLabel =
    typeof club.memberCount === "number"
      ? `${club.memberCount} member${club.memberCount === 1 ? "" : "s"}`
      : "Members";

  const categoryLabel = club.category || "Club";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <UsersRound className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {club.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {categoryLabel}
                {typeof club.memberCount === "number" && ` • ${memberLabel}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Pencil className="h-4 w-4" />
            Edit Club
          </button>
        </div>
        {club.description && (
          <p className="text-slate-600 dark:text-slate-400 mb-8">{club.description}</p>
        )}
        {!club.description && (
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            Add a description for your club in the admin panel to help students understand what you do.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/leader/events"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center hover:bg-primary/5 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-primary/10"
          >
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Events
            </span>
          </Link>
          <Link
            to="/leader/participants"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center hover:bg-primary/5 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-primary/10"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Participants
            </span>
          </Link>
        </div>
      </div>

      {/* Edit Club Modal */}
      <EditClubModal
        open={editModalOpen}
        club={club}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => {
          setEditModalOpen(false);
          fetchClub();
        }}
      />
    </div>
  );
}

function EditClubModal({ open, club, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && club) {
      setName(club.name || "");
      setDescription(club.description || "");
      setCategory(club.category || "");
      setLogoUrl(club.logoUrl || "");
      setError(null);
    }
  }, [open, club]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/admin/clubs/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        setLogoUrl(res.data.url);
      }
    } catch (err) {
      setError("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!club?._id) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/clubs/${club._id}`, {
        name: name.trim(),
        description: description.trim(),
        category,
        logoUrl,
      });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Club</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Club Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <UsersRound className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Club Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              placeholder="Enter club name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
              placeholder="Describe your club..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-[0_1px_2px_rgba(37,99,235,0.3)]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
