import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, ArrowUp } from "lucide-react";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Login", to: "/login" },
  { label: "About", to: "#about" },
  { label: "Contact", to: "#contact" },
];

function scrollToTop() {
  const hero = document.querySelector("#hero");
  if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomeFooter() {
  return (
    <footer id="contact" className="bg-navy text-slate-400 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden />
      <div className="container-1440 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14 pb-12 border-b border-slate-600/50">
          <div className="lg:pr-4">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/images/mits-logo-main.png"
                alt="MITS"
                className="h-11 w-11 rounded-full object-contain"
              />
              <span className="font-heading font-semibold text-white text-lg tracking-tight">
                MITS Event Management
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              A unified digital platform to plan, manage, and celebrate campus events with clarity and excellence.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Madhav Institute of Technology &amp; Science, Gwalior (M.P.), India
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-gold transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-5">
              Contact
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden />
                <span>Race Course Road, Gwalior, M.P. – 474005</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold shrink-0" aria-hidden />
                <a href="tel:+917512409397" className="hover:text-gold transition-colors">
                  +91 751-2409397
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold shrink-0" aria-hidden />
                <a href="mailto:info@mitsgwalior.in" className="hover:text-gold transition-colors">
                  info@mitsgwalior.in
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Madhav Institute of Technology &amp; Science, Gwalior. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>NAAC Accredited A++ • Deemed to be University</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-navy rounded"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
