import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
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
      <Products />
      <HowItWorks />
      <CustomDesign />
      <Contact />
      <Footer />
    </main>
  );
}
