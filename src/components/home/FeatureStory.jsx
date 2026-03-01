import React from "react";
import { motion } from "framer-motion";

const BULLETS = [
  "Centralized dashboard for all departmental activities.",
  "Seamless communication between organizers and attendees.",
  "Paperless management following Green Campus initiatives.",
];

export default function FeatureStory() {
  return (
    <>
      <section id="about" className="py-28 bg-white">
        <div className="container-1440">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80"
                  alt="Campus collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            <div>
              <motion.span
                className="text-gold font-semibold tracking-wider uppercase text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Empowering Campus Life
              </motion.span>
              <motion.h2
                className="font-heading font-bold text-3xl sm:text-4xl text-slate-800 mt-2 mb-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Clubs &amp; Campus Engagement
              </motion.h2>
              <motion.p
                className="text-lg text-slate-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
              >
                Fostering innovation, culture, leadership, and service beyond the classroom.
              </motion.p>
              <ul className="space-y-4">
                {BULLETS.map((text, i) => (
                  <motion.li
                    key={text}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold text-xs font-bold">✓</span>
                    </span>
                    <span className="text-slate-700">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 bg-[#F9F9F7]">
        <div className="container-1440">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <motion.span
                className="text-gold font-semibold tracking-wider uppercase text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                One Platform
              </motion.span>
              <motion.h2
                className="font-heading font-bold text-3xl sm:text-4xl text-slate-800 mt-2 mb-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                From Discovery to Certification
              </motion.h2>
              <motion.p
                className="text-lg text-slate-600 leading-relaxed"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Browse events, register with a single click, attend with QR check-in, and receive digital certificates—all in one place.
              </motion.p>
            </div>
            <motion.div
              className="rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-white"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
                App screenshot placeholder
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
