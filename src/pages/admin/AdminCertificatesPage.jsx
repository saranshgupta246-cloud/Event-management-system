import React from "react";
import { Link } from "react-router-dom";
import { Award, LayoutDashboard, Settings } from "lucide-react";

export default function AdminCertificatesPage() {
  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex flex-1 justify-center px-6 py-8 sm:px-10">
          <div className="layout-content-container flex w-full max-w-5xl flex-col gap-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Credentials
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Certificates Control Center
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                  Configure templates, automate distribution, and monitor verification
                  activity for all institute certificates.
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                to="/admin/events"
                className="admin-card flex flex-col rounded-2xl p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Event Certificates
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Open the events dashboard to issue certificates for any completed event.
                </p>
                <span className="mt-3 text-xs font-semibold text-blue-600">
                  Go to Events →
                </span>
              </Link>

              <Link
                to="/admin/certificates/designer"
                className="admin-card flex flex-col rounded-2xl p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                  <Award className="h-4 w-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Template Designer
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Design and manage certificate templates used across all clubs and
                  events.
                </p>
                <span className="mt-3 text-xs font-semibold text-blue-600">
                  Open Designer →
                </span>
              </Link>

              <div className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600 dark:border-[#1e2d42] dark:bg-[#161f2e]/40 dark:text-slate-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-100">
                  <Settings className="h-4 w-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Verification Portal
                </h2>
                <p className="mt-1">
                  The public verification portal is available at{" "}
                  <span className="font-mono text-[11px] text-slate-800 dark:text-slate-100">
                    /verify
                  </span>
                  . Share this link with recruiters and external institutions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

