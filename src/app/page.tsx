import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";
import Products from "@/components/Products";
import HowItWorks from "@/components/HowItWorks";
import CustomDesign from "@/components/CustomDesign";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustBadges />
      <Products />
      <HowItWorks />
      <CustomDesign />
      <Contact />
      <Footer />
    </main>
  );
}
