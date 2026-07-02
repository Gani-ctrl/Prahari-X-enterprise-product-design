import { useLenis } from "@/hooks/useLenis";
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { Features } from "./sections/Features";
import { Workflow } from "./sections/Workflow";
import { Stats } from "./sections/Stats";
import { Modules } from "./sections/Modules";
import { Testimonials } from "./sections/Testimonials";
import { CTA } from "./sections/CTA";
import { Footer } from "./sections/Footer";

export default function LandingPage() {
  useLenis();

  return (
    <div className="relative min-h-screen bg-[color:var(--color-base)] bg-noise">
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <Stats />
      <Modules />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
