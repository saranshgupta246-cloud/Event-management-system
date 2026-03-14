import React from "react";
import { useNavigate } from "react-router-dom";

export default function LeaderEvents() {
  const navigate = useNavigate();

  // TODO: Replace this placeholder list with real leader events data.
  const events = [];

  const handleViewCertificates = (eventId) => {
    if (!eventId) return;
    navigate(`/leader/certificates?eventId=${encodeURIComponent(eventId)}`);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
        Club Events
      </h2>
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8">
        {events.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage your club events here. Once events are available,
            you&apos;ll see a{" "}
            <span className="font-semibold">🎓 Certificates</span> button for
            each event to open the certificates view:
            <br />
            <span className="font-mono text-xs">
              /leader/certificates?eventId=&lt;EVENT_ID&gt;
            </span>
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                // eslint-disable-next-line no-underscore-dangle
                key={event._id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {event.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewCertificates(event._id)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400"
                >
                  🎓 Certificates
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
