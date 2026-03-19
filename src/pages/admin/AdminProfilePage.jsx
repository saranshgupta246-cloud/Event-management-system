import React, { useState, useMemo } from "react";
import useProfile from "../../hooks/useStudentProfile";
import useAdminDashboardStats from "../../hooks/useAdminDashboardStats";
import EditStudentProfileModal from "../../components/student/EditStudentProfileModal";
import { useAuth } from "../../context/AuthContext";

function StatCard({ icon, label, value }) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined text-xl">{icon}</span>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      </div>
      <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">
        {value}
      </p>
    </div>
  );
}

const SOCIAL_PLATFORMS = [
  {
    key: "github",
    label: "GitHub",
    icon: "code",
    placeholder: "https://github.com/yourusername",
    color: "text-slate-800 dark:text-slate-200",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "work",
    placeholder: "https://linkedin.com/in/yourusername",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    key: "twitter",
    label: "Twitter / X",
    icon: "alternate_email",
    placeholder: "https://twitter.com/yourusername",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/30",
  },
  {
    key: "website",
    label: "Portfolio",
    icon: "language",
    placeholder: "https://yourportfolio.com",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
  },
];

function SocialLinksSection({ socialLinks, onEditClick }) {
  const hasAnyLink = SOCIAL_PLATFORMS.some((p) => socialLinks?.[p.key]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary">link</span>
          Social Links
        </h2>
        <button
          type="button"
          onClick={onEditClick}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          {hasAnyLink ? "Edit" : "Add Links"}
        </button>
      </div>

      {hasAnyLink ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 sm:p-8">
          {SOCIAL_PLATFORMS.map((p) => {
            const url = socialLinks?.[p.key];
            if (!url) return null;
            return (
              <a
                key={p.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${p.bg}`}>
                  <span className={`material-symbols-outlined text-base ${p.color}`}>{p.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {p.label}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                    {url.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">
                  open_in_new
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-10 px-5 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-3">
            add_link
          </span>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            No social links yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
            Add your GitHub, LinkedIn, Twitter, or portfolio link to your profile.
          </p>
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Social Links
          </button>
        </div>
      )}
    </div>
  );
}

function SaveToast({ message, type }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed top-20 right-6 z-[60] flex items-center gap-3 rounded-xl px-5 py-3 shadow-xl border text-sm font-semibold transition-all duration-300 ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300"
          : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300"
      }`}
    >
      <span className="material-symbols-outlined text-lg">
        {isSuccess ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

export default function AdminProfilePage() {
  const { profile, loading, error, updateProfile, uploadAvatar: rawUploadAvatar } = useProfile();
  const { stats, loading: statsLoading } = useAdminDashboardStats();
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const mergedProfile = useMemo(
    () =>
      profile || user
        ? {
            ...(user || {}),
            ...(profile || {}),
          }
        : profile,
    [profile, user]
  );

  const displayName = mergedProfile?.name || "Admin";
  const displayDept = mergedProfile?.department || mergedProfile?.role || "Administrator";
  const avatarUrl = mergedProfile?.avatar || null;
  const socialLinks = mergedProfile?.socialLinks || {};

  const uploadAvatar = async (file) => {
    const result = await rawUploadAvatar(file);
    if (result.url) {
      setUser((prev) => (prev ? { ...prev, avatar: result.url } : prev));
    }
    return result;
  };

  const adminStats = [
    {
      icon: "school",
      label: "Total Students",
      value: stats?.totalStudents ?? 0,
    },
    {
      icon: "event",
      label: "Active Events",
      value: stats?.activeEvents ?? 0,
    },
    {
      icon: "verified",
      label: "Certificates Issued",
      value: stats?.certificatesIssued ?? 0,
    },
    {
      icon: "diversity_3",
      label: "Club Recruitment",
      value: stats?.clubRecruitment ?? 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {toast && <SaveToast message={toast.message} type={toast.type} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Loading profile…
          </p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        {/* Profile card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative shrink-0 self-start sm:self-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-primary/10 border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-slate-100 dark:bg-slate-800 ring-4 ring-primary/10 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    person
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight break-words">
                {displayName}
              </h1>
              {displayDept && (
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium mt-1">
                  {displayDept}
                </p>
              )}
              {profile?.bio && (
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          {adminStats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={statsLoading ? "…" : stat.value}
            />
          ))}
        </div>

        {/* Social Links */}
        <SocialLinksSection
          socialLinks={socialLinks}
          onEditClick={() => setIsEditing(true)}
        />

        <p className="mt-10 text-center text-xs text-slate-400">EMS MITS 2026</p>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <EditStudentProfileModal
            initialProfile={mergedProfile}
            uploadAvatar={uploadAvatar}
            onClose={() => setIsEditing(false)}
            onSave={async (payload) => {
              const res = await updateProfile(payload);
              if (res?.success && res.data) {
                const updated = res.data;
                setUser((prev) =>
                  prev ? { ...prev, name: updated.name ?? prev.name, avatar: updated.avatar ?? prev.avatar, department: updated.department ?? prev.department } : prev
                );
              }
              if (res?.success) {
                setIsEditing(false);
                showToast("Profile updated successfully!", "success");
              } else {
                showToast(res?.message || "Failed to update profile.", "error");
              }
              return res;
            }}
          />
        </div>
      )}
    </div>
  );
}
