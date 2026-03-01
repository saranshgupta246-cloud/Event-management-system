import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-0 border-t border-slate-900">
      <div className="container-1440 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/mits-logo-main.png"
              alt="MITS Logo"
              className="h-10 w-10 rounded-full object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">EMS MITS</p>
              <p className="text-xs text-slate-400">Madhav Institute of Technology &amp; Science</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <button type="button" className="hover:text-white transition-colors" onClick={(e) => e.preventDefault()}>
              Contact
            </button>
          </div>
          <p className="text-xs text-slate-500">EMS MITS 2026</p>
        </div>
      </div>
    </footer>
  );
}

