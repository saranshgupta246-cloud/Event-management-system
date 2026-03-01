import React from "react";
import { motion } from "framer-motion";

export default function TestimonialSection() {
  return (
    <section className="py-28 bg-white">
      <div className="container-1440">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <blockquote className="text-xl sm:text-2xl text-slate-700 leading-relaxed font-medium italic mb-8">
            &ldquo;The EMS platform made managing our tech fest effortless. From registration to certificates, everything was seamless. A game-changer for campus events.&rdquo;
          </blockquote>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center font-heading font-bold text-navy text-lg mb-3">
              AR
            </div>
            <p className="font-heading font-semibold text-slate-800">Aryan Sharma</p>
            <p className="text-sm text-slate-500">Computer Science Society, Final Year</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
