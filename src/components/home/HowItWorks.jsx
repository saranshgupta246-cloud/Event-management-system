import React from "react";
import { motion } from "framer-motion";
import { Search, ClipboardList, Users, Award } from "lucide-react";

const STEPS = [
  { icon: Search, title: "Discover", desc: "Browse events and clubs in one place." },
  { icon: ClipboardList, title: "Register", desc: "One-click registration with instant confirmation." },
  { icon: Users, title: "Participate", desc: "Attend with QR check-in and live updates." },
  { icon: Award, title: "Get Certified", desc: "Receive digital certificates automatically." },
];

export default function HowItWorks() {
  return (
    <section className="py-28 bg-[#F9F9F7]">
      <div className="container-1440">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-slate-800 mb-4">
            How It Works
          </h2>
          <p className="text-slate-600">
            Four simple steps from discovery to certification.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-slate-200" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white mb-4 relative z-10">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-semibold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 max-w-[200px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
