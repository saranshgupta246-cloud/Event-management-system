import React from "react";

export default function StudentCertificates() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          My Certificates
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          View and download certificates earned from events and activities.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
        Certificate history UI will go here. For now this is a frontend placeholder
        page wired to the navigation.
      </div>
    </div>
  );
}
