import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Theater,
  UserCog,
  Briefcase,
  ClipboardCheck,
  Award,
  MessageCircle,
  Megaphone,
  BarChart3,
  ScrollText,
  SlidersHorizontal,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

// Admin nav groups (for role === "admin")
const NAV_GROUPS = [
  {
    label: "MAIN",
    color: "blue",
    colorHex: "#3b82f6",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#60a5fa",
    iconBgActive: "#3b82f6",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/events", label: "Events", icon: CalendarDays },
      { to: "/admin/clubs", label: "All Clubs", icon: Theater },
    ],
  },
  {
    label: "MANAGEMENT",
    color: "purple",
    colorHex: "#a855f7",
    iconBg: "rgba(168,85,247,0.15)",
    iconColor: "#c084fc",
    iconBgActive: "#a855f7",
    items: [
      { to: "/admin/users", label: "Users", icon: UserCog },
      { to: "/admin/club-recruitment", label: "Recruitment", icon: Briefcase },
      { to: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/admin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "COMMUNICATION",
    color: "green",
    colorHex: "#22c55e",
    iconBg: "rgba(34,197,94,0.15)",
    iconColor: "#4ade80",
    iconBgActive: "#22c55e",
    items: [
      { to: "/admin/chat", label: "Chat", icon: MessageCircle },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "SYSTEM",
    color: "orange",
    colorHex: "#f97316",
    iconBg: "rgba(249,115,22,0.15)",
    iconColor: "#fb923c",
    iconBgActive: "#f97316",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
      { to: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
    ],
  },
];

const STUDENT_ITEMS = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/student/clubs", label: "Clubs", icon: Theater },
  { to: "/student/events", label: "Events", icon: CalendarDays },
  { to: "/student/recruitment", label: "Recruitment", icon: Briefcase },
  { to: "/student/my-registrations", label: "My Registrations", icon: ClipboardCheck },
  { to: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/student/certificates", label: "Certificates", icon: Award },
];

const LEADER_ITEMS = [
  { to: "/leader", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/leader/club", label: "Club", icon: Theater },
  { to: "/leader/club/team", label: "Team", icon: UserCog },
  { to: "/leader/recruitment", label: "Recruitment", icon: Briefcase },
  { to: "/leader/events", label: "Events", icon: CalendarDays },
  { to: "/leader/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/leader/announcements", label: "Announcements", icon: Megaphone },
  { to: "/leader/certificates", label: "Certificates", icon: Award },
  { to: "/leader/chat", label: "Chat", icon: MessageCircle },
];

function buildGroupsForRole(role) {
  if (role === "admin") return NAV_GROUPS;

  const items = role === "leader" ? LEADER_ITEMS : STUDENT_ITEMS;
  return [
    {
      label: "MAIN",
      color: "blue",
      colorHex: "#3b82f6",
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#60a5fa",
      iconBgActive: "#3b82f6",
      items,
    },
  ];
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "99, 102, 241";
}

export default function Sidebar({
  role = "student",
  collapsed,
  onToggle,
  mobileOpen,
  onClose,
  user,
  onLogout,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const { dark: isDark } = useTheme();

  const groups = buildGroupsForRole(role);

  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  const isActive = (to, exact = false) => {
    if (!to || to === "#") return false;
    if (exact) return location.pathname === to;
    if (to === "/leader/club") {
      return (
        location.pathname === "/leader/club" ||
        location.pathname === "/leader/club/"
      );
    }
    if (to === "/leader/club/team") {
      return location.pathname.startsWith("/leader/club/team");
    }
    return location.pathname.startsWith(to);
  };

  const roleLabel =
    role === "admin" ? "Admin" : role === "leader" ? "Club Leader" : "Student";

  const displayName =
    user?.name ||
    (role === "admin" ? "Admin" : role === "leader" ? "Leader" : "Student");

  const initials =
    displayName && typeof displayName === "string"
      ? displayName
          .split(" ")
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "M";

  const sidebarInner = (
    <>
      {/* Top logo section */}
      <div
        className="flex shrink-0 items-center gap-2.5 px-3 py-4"
        style={{
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          padding: "16px 12px",
          gap: 10,
        }}
      >
        <img
          src="/images/mits-logo-main.png"
          alt="MITS EMS logo"
          className="h-7 w-7 shrink-0 rounded-lg object-cover"
        />
        {!collapsed && (
          <motion.div
            className="min-w-0 flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p
              className="text-xs font-bold leading-tight"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#0f172a",
              }}
            >
              MITS EMS
            </p>
            <p
              className="mt-0.5 text-[9px] leading-tight"
              style={{
                color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              }}
            >
              Event Management
            </p>
          </motion.div>
        )}
      </div>

      {/* New Event button (admin only) */}
      {role === "admin" && (
        <div className="px-2.5 pt-2.5 pb-1" style={{ margin: "10px 10px 4px" }}>
          <button
            type="button"
            onClick={() => navigate("/admin/events/create")}
            className="flex w-full items-center gap-2 rounded-xl border-0 py-2.5 text-white transition-all hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              padding: 10,
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <PlusCircle size={16} className="shrink-0" />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                New Event
              </motion.span>
            )}
          </button>
        </div>
      )}

      {/* Navigation groups */}
      <nav
        className="flex flex-1 flex-col overflow-y-auto px-2 py-2"
        style={{
          padding: 8,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.sidebar-nav-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="sidebar-nav-scroll flex flex-1 flex-col overflow-y-auto">
          {groups.map((group, groupIdx) => (
            <div key={group.label} className="flex flex-col">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="px-2 pt-2 pb-1"
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "8px 8px 4px",
                    margin: "8px 0 4px",
                    color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)",
                  }}
                >
                  {group.label}
                </motion.div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  const rgb = hexToRgb(group.colorHex || group.iconBgActive);

                  const itemContent = (
                    <div
                      className="relative flex cursor-pointer items-center gap-2 rounded-lg py-1.5 transition-all duration-150"
                        style={{
                          padding: "7px 8px",
                          marginBottom: 2,
                          background: "transparent",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "transparent",
                        }}
                      onMouseEnter={() => setHoveredItem(item.to)}
                      onMouseLeave={() => setHoveredItem((prev) => (prev === item.to ? null : prev))}
                    >
                      <div
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: active ? group.iconBgActive : group.iconBg,
                          color: active ? "#ffffff" : group.iconColor,
                          boxShadow: active
                            ? `0 3px 10px rgba(${rgb}, 0.3)`
                            : "none",
                        }}
                      >
                        <Icon size={11} />
                      </div>
                      {!collapsed && (
                        <motion.div
                          className="min-w-0 flex-1 overflow-hidden"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          transition={{ duration: 0.2 }}
                        >
                          <span
                            className="block truncate text-xs"
                            style={{
                              fontSize: 12,
                              color: active
                                ? isDark
                                  ? "#ffffff"
                                  : "#0f172a"
                                : isDark
                                  ? "rgba(255,255,255,0.5)"
                                  : "rgba(0,0,0,0.5)",
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {item.label}
                          </span>
                        </motion.div>
                      )}
                      {collapsed && hoveredItem === item.to && (
                        <div
                          className="pointer-events-none absolute left-[56px] z-[100] whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium text-white"
                          style={{
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "#1e2130",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "rgba(255,255,255,0.1)",
                          }}
                        >
                          {item.label}
                        </div>
                      )}
                    </div>
                  );

                  const wrapperStyle = {
                    background: active
                      ? isDark
                        ? `rgba(${rgb}, 0.12)`
                        : `rgba(${rgb}, 0.08)`
                      : "transparent",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: active
                      ? isDark
                        ? `rgba(${rgb}, 0.2)`
                        : `rgba(${rgb}, 0.15)`
                      : "transparent",
                  };

                  const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                  const activeBg = active
                    ? isDark
                      ? `rgba(${rgb}, 0.12)`
                      : `rgba(${rgb}, 0.08)`
                    : "transparent";

                  if (!item.to || item.to === "#") {
                    return (
                      <button
                        key={item.to || item.label}
                        type="button"
                        className="w-full text-left"
                        onClick={item.onClick}
                        style={{
                          ...wrapperStyle,
                          borderRadius: 10,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = active ? activeBg : hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = activeBg;
                        }}
                      >
                        {itemContent}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="block"
                      style={{
                        ...wrapperStyle,
                        borderRadius: 10,
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = active ? activeBg : hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = activeBg;
                      }}
                    >
                      {itemContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Profile + collapse section */}
      <div
        className="shrink-0 px-2 pb-2 pt-2.5"
        style={{
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          padding: 10,
        }}
      >
        <div
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          style={{
            padding: "6px 8px",
            borderRadius: 10,
          }}
          title={displayName}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <motion.div
              className="min-w-0 flex-1 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="truncate text-[11px] font-semibold leading-tight"
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                }}
              >
                {displayName}
              </p>
              <p
                className="text-[9px] leading-tight"
                style={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                }}
              >
                {roleLabel}
              </p>
            </motion.div>
          )}
          {!collapsed && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="ml-auto rounded p-1 transition-colors hover:text-red-500"
              style={{
                color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              }}
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="mt-1.5 flex w-full items-center justify-center rounded-lg border py-1.5 transition-colors"
          style={{
            marginTop: 6,
            padding: 6,
            borderRadius: 10,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
            color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)";
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </>
  );

  const desktopAsideStyle = {
    position: "fixed",
    left: 12,
    top: 12,
    bottom: 12,
    height: "calc(100vh - 24px)",
    borderRadius: 20,
    overflow: "hidden",
    background: isDark ? "#16161f" : "#ffffff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.06)",
    boxShadow: isDark
      ? "0 8px 32px rgba(0,0,0,0.4)"
      : "0 8px 32px rgba(0,0,0,0.08)",
  };

  const mobileAsideStyle = {
    background: isDark ? "#16161f" : "#ffffff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.06)",
  };

  return (
    <>
      {/* Desktop sidebar - floating rounded card */}
      <motion.aside
        className="hidden md:flex md:flex-col md:z-40"
        initial={false}
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={desktopAsideStyle}
      >
        {sidebarInner}
      </motion.aside>

      {/* Mobile overlay sidebar */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        style={{ visibility: mobileOpen ? "visible" : "hidden" }}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <motion.aside
          className="absolute inset-y-0 left-0 flex w-[260px] flex-col overflow-hidden"
          initial={false}
          animate={{ x: mobileOpen ? 0 : -260 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={mobileAsideStyle}
        >
          {sidebarInner}
        </motion.aside>
      </div>
    </>
  );
}
