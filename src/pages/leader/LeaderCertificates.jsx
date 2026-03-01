import React from "react";
import { Award, Download, CheckCircle } from "lucide-react";

export default function LeaderCertificates() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Certificates</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Bulk Generate Certificates</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
            Generate participation or winner certificates for your event attendees. Upload a template and we will fill in names and event details.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-4 w-full max-w-sm text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hackathon_Template.pdf</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ready for 124 participants</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90">
              Generate All
            </button>
            <button type="button" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              Change Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
