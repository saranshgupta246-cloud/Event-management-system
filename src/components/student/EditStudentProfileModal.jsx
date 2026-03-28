import React, { useRef, useState } from "react";

const DEPT_OPTIONS = [
  { value: "cse", label: "Computer Science & Engineering" },
  { value: "ece", label: "Electronics & Communication" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "it", label: "Information Technology" },
  { value: "ee", label: "Electrical Engineering" },
  { value: "civil", label: "Civil Engineering" },
];

export default function EditStudentProfileModal({ onClose, onSave, initialProfile, uploadAvatar }) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [department, setDepartment] = useState(initialProfile?.department || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [socialLinks, setSocialLinks] = useState({
    github: initialProfile?.socialLinks?.github || "",
    linkedin: initialProfile?.socialLinks?.linkedin || "",
    twitter: initialProfile?.socialLinks?.twitter || "",
    website: initialProfile?.socialLinks?.website || "",
  });

  const [previewUrl, setPreviewUrl] = useState(initialProfile?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setUploadError(null);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required.";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaveError(null);
    setSaving(true);

    try {
      let avatarUrl = initialProfile?.avatar || null;

      if (avatarFile && typeof uploadAvatar === "function") {
        setUploading(true);
        const result = await uploadAvatar(avatarFile);
        setUploading(false);
        if (result?.error) {
          setUploadError(result.error);
          setSaving(false);
          return;
        }
        avatarUrl = result?.url ?? avatarUrl;
      }

      const res = await onSave({ name, department, bio, avatar: avatarUrl, socialLinks });
      if (res && !res.success) {
        setSaveError(res.message || "Failed to save profile. Please try again.");
      }
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const isBusy = uploading || saving;

  return (
    <div className="relative w-full max-w-[540px] bg-white dark:bg-[#161f2e] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#1e2d42]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#1e2d42]">
        <div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
            Edit Profile
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Update your personal information.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-28 w-28 rounded-full object-cover border-4 border-slate-100 dark:border-[#1e2d42] shadow-sm"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-slate-100 dark:bg-[#161f2e] border-4 border-slate-100 dark:border-[#1e2d42] flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#0d1117] hover:scale-105 transition-transform disabled:opacity-50"
              aria-label="Change photo"
            >
              {uploading ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="text-primary font-semibold text-sm hover:underline disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change Photo"}
          </button>

          <label htmlFor="edit-profile-avatar" className="sr-only">
            Profile photo
          </label>
          <input
            ref={fileInputRef}
            id="edit-profile-avatar"
            name="edit-profile-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploadError && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{uploadError}</p>
          )}
          {avatarFile && !uploadError && (
            <p className="text-xs text-slate-400 text-center truncate max-w-xs">
              {avatarFile.name}
            </p>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-profile-name" className="text-slate-800 dark:text-slate-200 text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-profile-name"
            name="edit-profile-name"
            type="text"
            className={`w-full rounded-xl border bg-white dark:bg-[#161f2e] dark:text-white h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              errors.name
                ? "border-red-400 dark:border-red-500"
                : "border-slate-200 dark:border-[#1e2d42]"
            }`}
            placeholder="e.g. Alex Johnson"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            disabled={isBusy}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-profile-department" className="text-slate-800 dark:text-slate-200 text-sm font-medium">
            Academic Branch
          </label>
          <div className="relative">
            <select
              id="edit-profile-department"
              name="edit-profile-department"
              className="appearance-none w-full rounded-xl border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#161f2e] dark:text-white h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isBusy}
            >
              <option value="">Select branch…</option>
              {DEPT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-profile-bio" className="text-slate-800 dark:text-slate-200 text-sm font-medium">
            Brief Bio
          </label>
          <textarea
            id="edit-profile-bio"
            name="edit-profile-bio"
            className="w-full rounded-xl border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#161f2e] dark:text-white min-h-[90px] p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
            placeholder="Describe your interests and skills…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isBusy}
          />
        </div>

        {/* Social Links */}
        <div className="flex flex-col gap-3">
          <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">
            Social Links
          </span>
          {[
            { key: "github", label: "GitHub", icon: "code", placeholder: "https://github.com/yourusername" },
            { key: "linkedin", label: "LinkedIn", icon: "work", placeholder: "https://linkedin.com/in/yourusername" },
            { key: "twitter", label: "Twitter / X", icon: "alternate_email", placeholder: "https://twitter.com/yourusername" },
            { key: "website", label: "Portfolio", icon: "language", placeholder: "https://yourportfolio.com" },
          ].map(({ key, label, icon, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#161f2e] flex items-center justify-center">
                <span className="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">{icon}</span>
              </div>
              <input
                id={`edit-profile-social-${key}`}
                name={`edit-profile-social-${key}`}
                type="url"
                className="flex-1 rounded-xl border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#161f2e] dark:text-white h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder={placeholder}
                value={socialLinks[key]}
                onChange={(e) =>
                  setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))
                }
                disabled={isBusy}
              />
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <div className="mx-6 mb-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {saveError}
        </div>
      )}
      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#161f2e]/50 border-t border-slate-100 dark:border-[#1e2d42]">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center gap-2"
        >
          {isBusy ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              {uploading ? "Uploading…" : "Saving…"}
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
