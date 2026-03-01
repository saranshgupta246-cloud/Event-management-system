import React from "react";
import HomeNavbar from "../components/HomeNavbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import BenefitsSection from "../components/BenefitsSection";
import HomeFooter from "../components/home/HomeFooter";

export default function Home() {
  return (
    <div className="font-display text-slate-900 bg-slate-50 antialiased">
      <HomeNavbar />
      <main>
        <HeroSection />
        <AboutSection />
        <BenefitsSection />
      </main>
      <HomeFooter />
    </div>
  );
}
