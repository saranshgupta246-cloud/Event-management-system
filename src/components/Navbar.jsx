import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut, ChevronDown, Moon, Sun, UserCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

const PAGE_TITLES = {
  "/student": "Dashboard",
  "/student/clubs": "Clubs",
  "/student/events": "Events",
  "/student/my-registrations": "My Registrations",
  "/student/certificates": "Certificates",
  "/student/recruitment": "Recruitment",
  "/student/profile": "My Profile",
  "/leader": "Dashboard",
  "/leader/club": "My Club",
  "/leader/events": "Events",
  "/leader/participants": "Participants",
  "/leader/attendance": "Attendance",
  "/leader/announcements": "Announcements",
  "/leader/certificates": "Certificates",
  "/leader/profile": "My Profile",
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/clubs": "Clubs",
  "/admin/club-recruitment": "Club Recruitment",
  "/admin/events": "Events",
  "/admin/attendance": "Attendance",
  "/admin/events/create": "Create Event",
  "/admin/announcements": "Announcements",
  "/admin/club-leader": "Club Leader",
  "/admin/profile": "My Profile",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/student/events/") && pathname.includes("/register")) return "Confirm Registration";
  if (pathname.startsWith("/student/events/") && pathname.includes("/success")) return "Success";
  if (pathname.startsWith("/student/events/")) return "Event Details";
  if (pathname.startsWith("/student/clubs/")) return "Club";
  if (pathname.startsWith("/leader/")) return "Club Leader";
  if (pathname.startsWith("/admin/")) return "Admin";
  return "EMS";
}

function getProfileRoute(role) {
  if (role === "admin") return "/admin/profile";
  if (role === "faculty_coordinator") return "/leader/profile";
  return "/student/profile";
}

export default function Navbar({ onMenuClick, pathname, user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pageTitle = getPageTitle(pathname ?? "/");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{pageTitle}</h1>
      </div>

      <div className="relative flex items-center gap-2" ref={ref}>
        <NotificationBell />
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
            dark
              ? "border-transparent bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
              : "bg-black/[0.06] border-black/[0.12] text-indigo-500 hover:bg-black/[0.09]"
          }`}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={() => setDropdownOpen((o) => !o)}
        >
          <div
            className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center shrink-0"
            style={{
              backgroundImage: user?.avatar
                ? `url("${user.avatar}")`
                : user?.avatar_url
                ? `url("${user.avatar_url}")`
                : "none",
            }}
          />
          <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:inline truncate max-w-[120px]">
            {user?.name ?? "User"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 dark:border-slate-700 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? user?.department ?? ""}</p>
            </div>
            <Link
              to={getProfileRoute(user?.role)}
              onClick={() => setDropdownOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <UserCircle className="h-4 w-4" />
              My Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
