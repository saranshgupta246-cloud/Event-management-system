import React from "react";

const STATS = [
  { label: "Events Hosted", value: "500+" },
  { label: "Total Registrations", value: "10,000+" },
  { label: "Active Clubs & Cells", value: "50+" }
];

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="py-16 sm:py-20 bg-[#fff6f7] border-y border-[#ffe0e3]"
    >
      <div className="container-1440">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div className="max-w-md">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
              Built for a Vibrant Campus
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              From cultural fests to high-impact workshops, the platform scales with every
              initiative at MITS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-left sm:text-center px-1"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-[#ff4d4f] mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

