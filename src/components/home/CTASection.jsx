import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-28 bg-navy">
      <motion.div
        className="container-1440 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
          Ready to Lead? Ready to Participate?
        </h2>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
          Join thousands of students and clubs already using MITS Event Management System.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-lg font-semibold text-navy hover:bg-gold/90 transition-colors shadow-lg"
        >
          Login to Portal
        </Link>
      </motion.div>
    </section>
  );
}
