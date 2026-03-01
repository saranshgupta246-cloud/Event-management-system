import React from "react";
import { Link } from "react-router-dom";

const scrollToSection = (hash) => {
  const el = document.querySelector(hash);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y - 80, behavior: "smooth" });
  }
};

export default function HomeNavbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 font-display">
      <div className="container-1440 flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-900 hover:opacity-90 transition-opacity"
        >
          <img
            src="/images/mits-logo-main.png"
            alt="MITS"
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="font-semibold text-lg tracking-tight hidden sm:inline">
            MITS Event Management
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection("#about")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("#benefits")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors hidden sm:inline-block"
          >
            Benefits
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("#contact")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors hidden sm:inline-block"
          >
            Contact
          </button>
          <Link
            to="/login"
            className="ml-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
