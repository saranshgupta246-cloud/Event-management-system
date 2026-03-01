import React from "react";
import AnimatedCounter from "./AnimatedCounter";

const STATS = [
  { value: 5000, suffix: "+", label: "Students" },
  { value: 120, suffix: "+", label: "Events Conducted" },
  { value: 35, label: "Active Clubs" },
  { value: 100, suffix: "%", label: "Digital Certification" },
];

export default function TrustStrip() {
  return (
    <section className="py-16 border-y border-slate-200/80 bg-white">
      <div className="container-1440">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center lg:border-r border-slate-200/80 last:border-r-0"
            >
              <span className="font-heading font-bold text-3xl sm:text-4xl text-navy mb-1 min-w-[4rem] inline-block">
                <AnimatedCounter end={stat.value} suffix={stat.suffix || ""} prefix={stat.prefix || ""} />
              </span>
              <span className="text-sm font-medium text-slate-600">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
