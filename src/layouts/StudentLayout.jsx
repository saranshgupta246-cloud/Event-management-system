import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true);
    } else {
      toggle();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-900 dark:bg-[#0a0a0f] dark:text-slate-100">
      <Sidebar
        role="student"
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      <div
        className={`flex min-h-screen flex-1 flex-col min-w-0 ${
          collapsed ? "md:ml-[92px]" : "md:ml-[264px]"
        }`}
        style={{ transition: "margin-left 0.25s ease" }}
      >
        <Navbar
          onMenuClick={handleMenuClick}
          pathname={location.pathname}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
