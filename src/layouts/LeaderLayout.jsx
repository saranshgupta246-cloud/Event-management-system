import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const LEADER_USER = {
  name: "Alex Rivera",
  email: "alex.rivera@mitsgwl.ac.in",
  department: "Club Leader",
  avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAILL-bv1b71qv4xbT7t7jcfKpZID3JgjfST7J2rOM2H1PAUVMHkdB78n5-_X7mOX0O4DFW8ImfjBk5_9xFxvCl5PSx6a2xHVuyqAKYD9OWPovYoWZDOr8xu8_Myxb8s5S5xTHFXY_qHAfdnAOQyl1AS_NEkiUTdhDigmUif1Ir8hpZ5X51E8n4HsQNIUZYc45Q87CpXmnfPy4rBgW-2PW3b92lCqVl9MslkKP6UD6M7jpB9pusZtGbrL5_IXIzZMu4LIK96ZA--AFI",
};

export default function LeaderLayout() {
  const location = useLocation();
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
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Sidebar
        role="leader"
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div
        className={`flex min-h-screen flex-1 flex-col min-w-0 transition-[margin-left] duration-300 ease-out ${
          collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <Navbar
          onMenuClick={handleMenuClick}
          pathname={location.pathname}
          user={LEADER_USER}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
