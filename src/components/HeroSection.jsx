import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const scrollToAbout = () => {
  const el = document.querySelector("#about");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HERO_STATS = [
  { value: "50+", label: "Events" },
  { value: "20+", label: "Clubs" },
  { value: "1000+", label: "Students" },
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="hero-gradient min-h-[680px] flex flex-col items-center justify-center text-center text-white relative"
    >
      <div className="container-1440 py-20 sm:py-24 flex flex-col items-center flex-1 justify-center">
        <div className="max-w-4xl mx-auto hero-content">
          <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-6">
            MITS Gwalior
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight drop-shadow-md bg-gradient-to-b from-white to-slate-200/90 bg-clip-text text-transparent">
            Unified Platform for Campus Events &amp; Student Leadership
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-10 sm:mb-12 text-slate-100/95 max-w-3xl mx-auto leading-relaxed">
            A centralized digital ecosystem for managing events, clubs, certifications, and campus
            initiatives with transparency and excellence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToAbout}
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base tracking-wide bg-white/15 border border-white/30 text-white shadow-sm hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300"
            >
              Explore Portal
            </button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base tracking-wide bg-gradient-to-r from-[#ff6b6d] to-[#ff4d4f] text-white shadow-md hover:shadow-lg transform hover:-translate-y-[3px] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 ease-out"
            >
              <span className="material-symbols-outlined mr-2">login</span>
              Login
            </Link>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium uppercase tracking-wider text-white/80">
            {HERO_STATS.map(({ value, label }) => (
              <span key={label}>
                <span className="text-white font-semibold">{value}</span> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={scrollToAbout}
        aria-label="Scroll to explore"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full transition-colors"
      >
        <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
        <ChevronDown className="h-6 w-6 motion-safe:animate-bounce" aria-hidden />
      </button>
    </section>
  );
}
