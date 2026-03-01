import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80";

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background image - visible */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${HERO_IMAGE}")`,
        }}
      />
      {/* Dark overlay for readability - gradient so image still shows through */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(11,30,61,0.88) 0%, rgba(11,30,61,0.5) 45%, rgba(11,30,61,0.35) 70%, rgba(11,30,61,0.6) 100%)",
        }}
      />
      <div className="container-1440 relative z-10 py-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <motion.h1
            className="font-heading font-bold text-white text-[clamp(1.85rem,4.5vw,3.5rem)] leading-[1.2] tracking-tight mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Empowering Campus Leadership Through Digital Excellence
          </motion.h1>
          <motion.p
            className="text-lg text-white/90 max-w-xl mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            A unified digital platform for events, clubs, certifications, and student growth.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <a
              href="#events"
              className="inline-flex items-center justify-center rounded-xl bg-[#C6A75E] px-6 py-3.5 text-base font-semibold text-[#0B1E3D] shadow-lg hover:bg-[#d4b86a] hover:shadow-xl transition-all duration-200"
            >
              Explore Events
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/50 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-all duration-200"
            >
              Login Portal
            </Link>
          </motion.div>
        </div>
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            </div>
            <div className="space-y-3">
              {[85, 72, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-white/20"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 rounded-lg bg-white/15" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
