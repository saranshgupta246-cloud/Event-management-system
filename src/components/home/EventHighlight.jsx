import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FEATURED = {
  title: "National Tech Symposium 2024",
  date: "24 Oct 2024",
  organizer: "Computer Science Society",
  slug: "national-tech-symposium-2024",
  poster: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
};

const MORE = [
  { title: "Winter Music Fest", date: "2 Nov 2024", slug: "winter-music-fest" },
  { title: "Career Fair 2024", date: "15 Nov 2024", slug: "career-fair-2024" },
  { title: "Photography Workshop", date: "18 Nov 2024", slug: "photography-workshop" },
];

export default function EventHighlight() {
  const scrollRef = useRef(null);

  return (
    <section id="events" className="py-28 bg-white">
      <div className="container-1440">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-slate-800 mb-2">
            Featured Events
          </h2>
          <p className="text-slate-600">Upcoming events you don&apos;t want to miss.</p>
        </motion.div>
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth custom-scrollbar" ref={scrollRef}>
          <motion.div
            className="flex-shrink-0 w-full sm:w-[400px] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-lg hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
          >
            <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
              <img
                src={FEATURED.poster}
                alt={FEATURED.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="font-heading font-semibold text-xl text-slate-800 mb-2">{FEATURED.title}</h3>
              <p className="text-sm text-slate-500 mb-1">{FEATURED.date}</p>
              <p className="text-sm text-slate-600 mb-4">Organized by {FEATURED.organizer}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
              >
                Register
              </Link>
            </div>
          </motion.div>
          {MORE.map((evt, i) => (
            <motion.div
              key={evt.slug}
              className="flex-shrink-0 w-[280px] rounded-xl border border-slate-200/80 bg-white p-4 hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i + 1) * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="aspect-video rounded-lg bg-slate-100 mb-3" />
              <h3 className="font-heading font-semibold text-slate-800 mb-1 truncate">{evt.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{evt.date}</p>
              <Link
                to="/login"
                className="text-sm font-medium text-gold hover:underline"
              >
                View & Register →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
