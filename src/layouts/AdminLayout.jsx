import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../hooks/useSidebar";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div data-theme="admin" style={{ "--active-color": "#ec5b13" }}>
        <Sidebar
          role="admin"
          collapsed={collapsed}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>
      <div
        className={`flex min-h-screen flex-1 flex-col min-w-0 transition-[margin-left] duration-300 ease-out ${
          collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <Navbar
          onMenuClick={handleMenuClick}
          pathname={location.pathname}
          user={user || { name: "Admin", email: "" }}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
