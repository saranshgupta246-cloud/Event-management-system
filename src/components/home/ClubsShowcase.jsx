import React from "react";

const CLUBS = [
  { name: "Computer Science Society", category: "Technical", members: 420, logo: null },
  { name: "Cultural Council", category: "Cultural", members: 380, logo: null },
  { name: "Robotics Club", category: "Technical", members: 195, logo: null },
  { name: "Literary Society", category: "Literary", members: 156, logo: null },
];

export default function ClubsShowcase() {
  return (
    <section className="py-28 bg-[#F9F9F7]">
      <div className="container-1440">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-slate-800 mb-4">
            Campus Clubs
          </h2>
          <p className="text-slate-600">
            Discover and join student-led clubs driving innovation and culture on campus.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CLUBS.map((club) => (
            <div
              key={club.name}
              className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-gold/30 hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center mb-4 text-navy font-heading font-bold text-xl">
                {club.name.charAt(0)}
              </div>
              <h3 className="font-heading font-semibold text-slate-800 mb-1">{club.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{club.category}</p>
              <p className="text-sm text-slate-600 mb-4">{club.members} members</p>
              <button
                type="button"
                className="w-full py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-navy/30 transition-colors"
              >
                View Club
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
