import React from "react";

export default function AboutSection() {
  return (
    <section id="about" className="py-32">
      <div className="container-1440">
        <div className="grid grid-cols-12 gap-16 items-center">
          <div className="col-span-12 lg:col-span-6">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-2xl -z-10" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlSNO2UPwackCX_V2xBRjm-SIA1C_48XKAQSEa21071sVfuJtoRMpOWfGnGpAiBcDgsFNbWoD8nAPaLOMsUiO10rPQVGDOpUnZVeXHkaXDSYIoZgGnDpLKHqYTKf8VR5yMUTSZwH0aVD-LKYZOMZGCLsuLpQpS_nUHymm1vrd4HYGcQLOvGW_dMvSPiPc_Jm311J-Btt9YnWSaEQQfB7p0iaJ0BFg320AkpCCgUSsUN4qOIEk2GUcyzrxcwCgiwTk8NU_RJ9Ftc-Np"
                alt="Students collaborating"
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-2xl -z-10" />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <span className="text-primary dark:text-blue-400 font-bold tracking-[0.2em] uppercase text-sm inline-block mb-4">
              Empowering Campus Life
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-slate-900 dark:text-white leading-tight">
              Clubs &amp; Campus Engagement
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Fostering innovation, culture, leadership, and service beyond the classroom.
            </p>

            <div className="space-y-6">
              {[
                "Centralized dashboard for all departmental activities.",
                "Seamless communication between organizers and attendees.",
                "Paperless management following Green Campus initiatives.",
              ].map((text) => (
                <div key={text} className="flex items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full mr-4">
                    <span className="material-symbols-outlined text-green-600 text-xl font-bold">
                      check
                    </span>
                  </div>
                  <span className="text-lg text-slate-700 dark:text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

