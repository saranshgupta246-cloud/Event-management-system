import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Award,
  Bell,
  User,
  Users,
  UsersRound,
  FileText,
  Briefcase,
  BarChart3,
  Settings,
  Megaphone,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";

const STUDENT_ITEMS = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/clubs", label: "Clubs", icon: UsersRound },
  { to: "/student/events", label: "Events", icon: Calendar },
  { to: "/student/recruitment", label: "Recruitment", icon: Briefcase },
  { to: "/student/my-registrations", label: "My Registrations", icon: ClipboardList },
  { to: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/student/certificates", label: "Certificates", icon: Award },
];

const LEADER_ITEMS = [
  { to: "/leader", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leader/club", label: "My Club", icon: UsersRound },
  { to: "/leader/events", label: "Events", icon: Calendar },
  { to: "/leader/participants", label: "Participants", icon: Users },
  { to: "/leader/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/leader/announcements", label: "Announcements", icon: Megaphone },
  { to: "/leader/certificates", label: "Certificates", icon: Award },
  { to: "/leader/chat", label: "Chat", icon: MessageCircle },
];

const ADMIN_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/clubs", label: "All Clubs", icon: UsersRound },
  { to: "/admin/club-recruitment", label: "Club Recruitment", icon: Briefcase },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/chat", label: "Chat", icon: MessageCircle },
  { to: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/admin/announcements", label: "Announcements", icon: Bell },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/audit", label: "Audit Logs", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  role = "student",
  collapsed,
  onToggle,
  mobileOpen,
  onClose,
}) {
  const location = useLocation();
  const items =
    role === "admin" ? ADMIN_ITEMS : role === "leader" ? LEADER_ITEMS : STUDENT_ITEMS;

  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  const isActive = (to) => {
    if (to === "#") return false;
    if (to === "/student") return location.pathname === "/student";
    if (to === "/admin") return location.pathname === "/admin";
    if (to === "/leader") return location.pathname === "/leader";
    return location.pathname.startsWith(to);
  };

  const roleLabel = role === "admin" ? "Admin" : role === "leader" ? "Club Leader" : "Student";

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 px-3 bg-white/95 dark:bg-slate-900/95">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <img
            src="/images/mits-logo-main.png"
            alt="MITS EMS logo"
            className="h-8 w-8 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              MITS
            </p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-50 truncate">
              Event Management System
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {roleLabel}
            </p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          const linkContent = (
            <>
              <Icon
                className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300"
                style={active ? { color: "var(--active-color, #2563eb)" } : {}}
              />
              {!collapsed && (
                <span className="truncate text-sm font-medium">{item.label}</span>
              )}
            </>
          );
          const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${
            active ? "bg-primary/10 dark:bg-primary/25 font-semibold" : ""
          } ${collapsed ? "justify-center" : ""}`;
          const style = active ? { color: "var(--active-color, #137fec)" } : {};

          if (item.to === "#") {
            return (
              <button
                key={item.label}
                type="button"
                className={className}
                style={style}
                title={collapsed ? item.label : undefined}
              >
                {linkContent}
              </button>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={className}
              style={style}
              title={collapsed ? item.label : undefined}
            >
              {linkContent}
            </Link>
          );
        })}
        {role === "admin" && (
          <>
            <Link
              to="/admin/events/create"
              className={`mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 ${collapsed ? "p-2.5" : ""}`}
              title={collapsed ? "New Event" : undefined}
            >
              <span className="text-lg">+</span>
              {!collapsed && "New Event"}
            </Link>
          </>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-40 md:bg-white md:border-r md:border-slate-200 md:shrink-0 dark:bg-slate-900 dark:border-slate-800"
        style={{
          width: collapsed ? 72 : 260,
          transition: "width 0.3s ease",
        }}
      >
        {sidebarContent}
        <div className="border-t border-slate-200 dark:border-slate-800 p-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className="h-5 w-5 transition-transform duration-300"
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        style={{ visibility: mobileOpen ? "visible" : "hidden" }}
      >
        <div
          className="absolute inset-0 bg-black/30 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <aside
          className="absolute inset-y-0 left-0 w-[260px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
        >
          {sidebarContent}
          <div className="border-t border-slate-200 dark:border-slate-800 p-2">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close menu
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
