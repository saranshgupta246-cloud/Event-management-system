import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, Clock3, Percent } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function StatCard({ label, value, tone, icon }) {
  const toneClasses = {
    neutral:
      "bg-slate-50 text-slate-900 border-slate-100 dark:bg-[#161f2e] dark:text-slate-100 dark:border-[#1e2d42]",
    green:
      "bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800/60",
    red: "bg-rose-50 text-rose-900 border-rose-100 dark:bg-rose-900/20 dark:text-rose-100 dark:border-rose-800/60",
    blue: "bg-sky-50 text-sky-900 border-sky-100 dark:bg-sky-900/20 dark:text-sky-100 dark:border-sky-800/60",
  }[tone || "neutral"];

  const iconBgClasses = {
    neutral: "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900",
    green: "bg-emerald-600 text-white",
    red: "bg-rose-600 text-white",
    blue: "bg-sky-600 text-white",
  }[tone || "neutral"];

  return (
    <motion.div
      variants={cardVariants}
      className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-lg ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500/90 dark:text-slate-400/90">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs shadow-sm ${iconBgClasses}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function AttendanceStats({ totals, loading }) {
  const registered = totals?.registered ?? 0;
  const present = totals?.present ?? 0;
  const pending = totals?.pending ?? Math.max(registered - present, 0);
  const percentage = typeof totals?.percentage === "number" ? totals.percentage : 0;

  if (loading && !totals) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg dark:border-[#1e2d42] dark:bg-[#161f2e]"
          >
            <div className="flex animate-pulse flex-col gap-3">
              <div className="h-3 w-20 rounded-full bg-slate-100 dark:bg-[#161f2e]" />
              <div className="h-7 w-24 rounded-full bg-slate-100 dark:bg-[#161f2e]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        label="Total Registered"
        value={registered}
        tone="neutral"
        icon={<Users className="h-4 w-4" />}
      />
      <StatCard
        label="Checked In"
        value={present}
        tone="green"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <StatCard
        label="Not Arrived / Pending"
        value={pending}
        tone="red"
        icon={<Clock3 className="h-4 w-4" />}
      />
      <StatCard
        label="Attendance %"
        value={`${percentage}%`}
        tone="blue"
        icon={<Percent className="h-4 w-4" />}
      />
    </motion.div>
  );
}

