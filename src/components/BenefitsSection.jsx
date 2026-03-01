import React from "react";

const BENEFITS = [
  {
    title: "Centralized Hub",
    description:
      "Discover every technical fest, workshop, and cultural meet in one single location. No more missed notices.",
    icon: "hub",
    bgClass: "bg-blue-100 dark:bg-blue-900/30 group-hover:bg-primary",
    iconClass: "text-primary dark:text-blue-400 group-hover:text-white",
  },
  {
    title: "Auto Certificates",
    description:
      "Instantly generate and download your participation or winner certificates as soon as the event concludes.",
    icon: "card_membership",
    bgClass: "bg-red-100 dark:bg-red-900/30 group-hover:bg-secondary",
    iconClass: "text-secondary dark:text-red-400 group-hover:text-white",
  },
  {
    title: "Smart Notifications",
    description:
      "Receive real-time updates about venue changes, schedule adjustments, or new event announcements.",
    icon: "notifications_active",
    bgClass: "bg-green-100 dark:bg-green-900/30 group-hover:bg-green-600",
    iconClass: "text-green-600 dark:text-green-400 group-hover:text-white",
  },
  {
    title: "Attendance Tracking",
    description:
      "Contactless attendance using QR codes, ensuring accurate records for academic credit and evaluation.",
    icon: "query_stats",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-600",
    iconClass: "text-yellow-600 dark:text-yellow-400 group-hover:text-white",
  },
  {
    title: "Easy Approval Flow",
    description:
      "Club leaders can submit event proposals for HOD and Director approval directly through the digital system.",
    icon: "assignment_turned_in",
    bgClass: "bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-600",
    iconClass: "text-purple-600 dark:text-purple-400 group-hover:text-white",
  },
  {
    title: "Mobile Ready",
    description:
      "Register and manage your events on the go. Our responsive design works perfectly on any handheld device.",
    icon: "smartphone",
    bgClass: "bg-cyan-100 dark:bg-cyan-900/30 group-hover:bg-cyan-600",
    iconClass: "text-cyan-600 dark:text-cyan-400 group-hover:text-white",
  },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-32">
      <div className="container-1440">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            Key Benefits
          </h2>
          <div className="w-20 h-1.5 bg-primary mx-auto mb-8 rounded-full" />
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Experience a smarter way to manage and participate in campus events with our
            purpose-built technical features.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all h-full border border-slate-100 dark:border-slate-700 group">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors ${benefit.bgClass}`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl ${benefit.iconClass}`}
                  >
                    {benefit.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

