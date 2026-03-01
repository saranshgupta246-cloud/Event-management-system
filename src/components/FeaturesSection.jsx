import React from "react";

const FEATURES = [
  {
    title: "Easy Event Registration",
    description:
      "Students can discover and join events in just a few clicks with a unified event catalog.",
    icon: "event_available"
  },
  {
    title: "Automated Certificates",
    description:
      "Generate and distribute participation and winner certificates instantly after events.",
    icon: "card_membership"
  },
  {
    title: "Transparent Management",
    description:
      "Track approvals, logistics, and post-event reports in one place for complete visibility.",
    icon: "visibility"
  },
  {
    title: "Role-Based Dashboards",
    description:
      "Tailored views for students, clubs, and administrators to focus on what matters most.",
    icon: "dashboard"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24 bg-white">
      <div className="container-1440">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Designed for Modern Campus Operations
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Powerful yet simple tools to help you plan, run, and measure events across the
            institution.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl px-6 py-7 sm:px-7 sm:py-8 transition-all duration-300 ease-out transform hover:-translate-y-1"
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#ffe5e6] text-[#ff4d4f] mb-5 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-xl">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

