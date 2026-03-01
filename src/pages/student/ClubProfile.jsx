import React, { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  Terminal,
  MapPin,
  FileText,
  Calendar,
  Users,
  Clock,
  Link2,
  Share2,
  Mail,
  ZoomIn,
  ImageIcon,
} from "lucide-react";
import { CLUB_DIRECTORY_MOCK } from "../../data/mockData";

const MOCK_PROFILE = {
  slug: "code-chef-mits",
  name: "MITS Coding Club",
  tagline: "Computer Science Department, MITS Gwalior",
  banner: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCD3xF2mOWEvqf8EpHtdr-hYR9wv6rSBzJqdkzFcWIGJHYReKQ6_mFhLwVq53fHljQukSIHwgX-NpZDC7HE1U3MagvNPXg4Urlr9gLpPQET-zSUM4FmfxFxDJmRP4PYaCM1_nQn-9qDgoV7eRPnvqjzhtJjuQfFUvk-ER7Y5AnBDSmBsFZdZWoBoWnop5U1o9kSAIvgNMAmQsARzkV9CPyj8LdxmXtm6pi_dlBI4tGqYTtfANauEkQLqW-LloBNtTNR9DdBupkAjnF",
  recruitmentActive: true,
  members: 542,
  eventsCount: 48,
  committee: [
    { name: "Arjun Sharma", role: "President, Final Year", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeGlWbIkAjWHd_KjdVcEb5sPn9_IJVpQzfcfSyFpul1monOGxYrryZCmK1d9eHMOMrRun4FL7yMiszwxIOaC467GljhzhlahGBlnY0q979JoRfVsn_cUlzOIrSpb1yHRUCGZs5ODH_PRul4gAjt8F68oV0qwm5JS_OpYsUCOaqQOO-SV4YswmbZUzCf2D8kbUSSNVYuy174g91rXEErQE48RkL2NOoY6BGgycTtt-uaT0zF76WPByAnqzglb7h73dOnANgkC7q-0hm" },
    { name: "Priya Verma", role: "Technical Lead, 3rd Year", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwT8mU6pLyi1Ce3Qc3-gptfocNuK0V1Qa42mIjYju--L0ltHl7lyzmPOTZQ9KdNxnr_cBlv6kaM2UwRxarddgiyZNgte-yXgL4XMAUKK4is-rOnLnGYSTONe_kCEeqB2MI3xsyxNrHkHnhwhLgoYhBDSY8PP-BaFj4xiyHkUK4vOExp9dywVNBmIxtWZSS3n2BLLTSAWbVzSMM8XBLPf7FkiArW61M3OSnSpthPIcsHZIUQ1N_A9sS93EpC89SG_H-DCFJouVnXF4I" },
    { name: "Rohan Gupta", role: "Event Head, 3rd Year", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFHiePJlgaQvzboHJ_ayz17_bkhwTOKe1eBwS1odYXKfpv_ThRiXQyC8NI0zLw5BwgwITJsq7upTY61LuHcGWIJxm4HepL2jcIhrY0dLp8_c58QJH2dO9PWy1aPVCQOoA7g0LrmhIPlpDUN1Mdm-hf123T0Ddm5hgOp_boiHlPUIIkN8Jg917v_AWaryNb8Ko9WGN5tkryDgmm3pZWYtiN7Wk6ODtCygh9slLvYr0ydm3g3mfATgoKTzhaGVz0IyjvWJ1NOM3HcCBV" },
  ],
  about: [
    "Founded in 2012, the MITS Coding Club is the premier technical community at Madhav Institute of Technology and Science. We are dedicated to fostering a culture of algorithmic thinking, software engineering excellence, and technological innovation.",
    "Our mission is to bridge the gap between academic theory and industry practices by providing students with hands-on projects, competitive programming environments, and workshops on emerging technologies like AI/ML, Web3, and Open Source contributions.",
  ],
  upcomingEvents: [
    { id: "e1", title: "Autumn Code Fest 2024", desc: "A 24-hour hackathon focused on sustainable development goals and smart city solutions for Gwalior.", date: "Oct", day: "24", registered: 120, cta: "Register Now" },
    { id: "e2", title: "React Patterns Workshop", desc: "Master advanced React patterns and state management with industry experts from top tech firms.", date: "Nov", day: "05", time: "4:00 PM - 7:00 PM", cta: "View Details" },
  ],
  gallery: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBblfVqS7PGxVWha6dRiudfCA9-F4WTwH1LCX3MUJXOaaG6tmbL4uS3raEz-VxXDkusYoqiaA4JJkQZPgGbDHDlsBb2VU2feK1ZWsuOBEDAeHbHwrv-N6p2_3ZzxQxA-HX2vpxj-I9JGNyyB9hgxAyDHk45HQkczmsBA8pz-O7q-wnzd4F3A6B8qIICizKvUDtwXLM88HkWIU_CtfNh7OB51AWvlXlqPzuTKuRJNoxLTWu-6Cq3Kst-AilfT4_vf-jMK2dMDixNTWtH",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDmbccqvW5Bkc1xLQ7cdtM8zy52Xlvf69YTr3b-uxsrTOsVTp_aGG-pe5-c_RQ6DOlyAp-yoaQ1y-2SijLDb8UrJKm4pn4g9J9VBSk5dndKBFTXzzVxfk29TwPnBn0I1eatwVK_FErsMSVO7XQuf-eqqZOs6rX96YHXUnVhN8TiKipJD0cgNIerA38Mv3CiM-SCeqJ_SZ1lYfbChVDh_oLPM6k-iqTXNlB2sv1vfGyOJgAXU5ZzsbnPm2BxzEGBLeq9mH7k1N1p9SMK",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA7Oeg5Cb6QKIbjXJwgmUtmQISsrOnd2hfNjE9H1hCuBcxh5RjIEKcGLCQxAxpvwz5MrbEh-_lq7RWVQrp06hF8ElQX_meb5RxNNGbsj-xrZzkbGHhV1V7WeTFmhmP0rQ3OcK9AbBLQCK3yqDkmsKa-ODad7sDcQZ6gO2EyfLnXC6vyRF0y4mTgefQFBVIj3tzb_eaeavE3HV3qlVBboa68nOlOVJHvIkYV_VSjqjxcbyrEWN3Pq4Pzz2YI3FN4xcF6qGrl211H3Txv",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAnwgWvN_pTkQPHnENGtAUfCxaZ41P7JBTZL1mMF0XSTdU2l_f36VYx4NUB9wPsPoTA_N_ZZC2C-bmEIloWE0VNY7oO_KnTjn3US0tANA57SwoNydOaIq1P-4-55MuZerfdGCAouMk8ZYYpPByTzZP_qEoDSELKiAhS9RYDuVf3Fgub4qXNulFRmt8Pjp5YMVz52CapqQV7z3MHsgryLM0PMw8JTYnHGpt8TiumejS0kJGOvwnSuc6ROoSJpwqCdj82uBCwD5vvq5iX",
  ],
  mapImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrwKeD4Bf64vEhj9AxRWD__vRbAsOmsLoQFRjtzW88B1Roe1GKBsATcq6tpsMZLzQlJOu-u56mkDf--Epw47V1LYA3HFW9f9BkZp8JYcgypfO0xksvUwTbm8Potm2cDdyBMfWGRraDYtkIDJdw3L8TkxE_WuYZ93BT-Z7Hf6DjFJImv2LUsuk06ApHpRdLiYyi_PUvhdwstE0emGZb2X2p2bk64dOh4rmZqfHoL2O2toprVzNIkQvgkWra-3iX7oJDgQHuJBwTybdw",
};

export default function ClubProfile() {
  const { slug } = useParams();
  const [toast, setToast] = useState(null);
  const directoryClub = CLUB_DIRECTORY_MOCK.find((c) => c.slug === slug);
  const profile = slug === "code-chef-mits" ? MOCK_PROFILE : {
    ...MOCK_PROFILE,
    name: directoryClub?.name ?? slug,
    tagline: directoryClub?.description ?? "",
  };

  if (!directoryClub && slug !== "code-chef-mits") {
    return <Navigate to="/student/clubs" replace />;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-[1440px] pb-20">
        {/* Hero */}
        <div className="relative h-[320px] w-full overflow-hidden bg-slate-200">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <img src={profile.banner} alt="Club banner" className="h-full w-full object-cover" />
          <div className="absolute bottom-0 left-0 z-20 flex w-full items-end gap-6 p-8">
            <div className="flex h-32 w-32 flex-shrink-0 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-primary text-white">
                <Terminal className="h-12 w-12" />
              </div>
            </div>
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white">{profile.name}</h1>
                {profile.recruitmentActive && (
                  <span className="rounded bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Active Recruitment</span>
                )}
              </div>
              <p className="flex items-center gap-2 text-slate-200">
                <MapPin className="h-4 w-4" />
                {profile.tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-8 px-8">
          {/* Sidebar */}
          <aside className="col-span-12 space-y-8 lg:col-span-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Members</p>
                <h4 className="mt-1 text-2xl font-bold text-primary">{profile.members}+</h4>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Events</p>
                <h4 className="mt-1 text-2xl font-bold text-primary">{profile.eventsCount}</h4>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Core Committee</h3>
                <span className="text-sm text-slate-400">info</span>
              </div>
              <div className="space-y-4 p-4">
                {profile.committee?.map((person) => (
                  <div key={person.name} className="flex items-center gap-3">
                    <img src={person.avatar} alt={person.name} className="size-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.role}</p>
                    </div>
                  </div>
                ))}
                <button type="button" className="w-full rounded-lg py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
                  View All Team Members
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">Connect with us</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setToast("Link not configured"); setTimeout(() => setToast(null), 2500); }}
                  className="flex size-10 items-center justify-center rounded-lg bg-slate-100 transition-all hover:bg-primary hover:text-white dark:bg-slate-700"
                  aria-label="External link"
                >
                  <Link2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setToast("Link not configured"); setTimeout(() => setToast(null), 2500); }}
                  className="flex size-10 items-center justify-center rounded-lg bg-slate-100 transition-all hover:bg-primary hover:text-white dark:bg-slate-700"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setToast("Link not configured"); setTimeout(() => setToast(null), 2500); }}
                  className="flex size-10 items-center justify-center rounded-lg bg-slate-100 transition-all hover:bg-primary hover:text-white dark:bg-slate-700"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </button>
              </div>
              {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium shadow-lg">
                  {toast}
                </div>
              )}
            </div>

            <div className="relative h-48 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
              <img src={profile.mapImage} alt="Campus map" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white dark:bg-slate-800 p-2 shadow-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="col-span-12 space-y-10 lg:col-span-9">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">About the Club</h2>
              </div>
              <div className="prose max-w-none leading-relaxed text-slate-600 dark:prose-invert dark:text-slate-400">
                {profile.about?.map((p, i) => (
                  <p key={i} className={i > 0 ? "mt-4" : ""}>{p}</p>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Upcoming Events</h2>
                </div>
                <Link to="/student/events" className="text-sm font-bold text-primary hover:underline">View Calendar</Link>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {profile.upcomingEvents?.map((ev) => (
                  <div key={ev.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="relative h-44 overflow-hidden">
                      <div className="h-full w-full bg-slate-300" />
                      <div className="absolute left-3 top-3 rounded-lg bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-center shadow-sm backdrop-blur">
                        <p className="text-xs font-bold uppercase text-primary">{ev.date}</p>
                        <p className="text-lg font-black leading-none text-slate-900 dark:text-white">{ev.day}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="mb-2 text-lg font-bold transition-colors group-hover:text-primary">{ev.title}</h3>
                      <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{ev.desc}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          {ev.registered ? <><Users className="h-4 w-4" /> {ev.registered}+ Registered</> : <><Clock className="h-4 w-4" /> {ev.time}</>}
                        </span>
                        <button type="button" className="rounded-lg bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white">
                          {ev.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Past Highlights</h2>
                </div>
                <button type="button" className="text-sm font-bold text-slate-500 transition-colors hover:text-primary">See all photos</button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {profile.gallery?.map((img, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                    <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
