import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import ThemeEffects from "@/components/ThemeEffects";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Custom T-Shirt & Personalized Printing Services | PrintStyle",
  description: "Looking for premium custom printing? Design your own unique t-shirts, cushions, couches, and heart-shaped pillows. High-quality custom printing services at the lowest prices with 100% satisfaction guarantee.",
  keywords: "custom t-shirt printing, custom pillows, heart shaped pillows, personalized gifts, custom couches, premium printing services, custom merchandise, print on demand",
  openGraph: {
    title: "Custom T-Shirt & Personalized Printing Services | PrintStyle",
    description: "Design your own unique t-shirts, cushions, couches, and heart-shaped pillows. High-quality custom printing services.",
    url: "https://custom-print-eta.vercel.app",
    siteName: "PrintStyle",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AppProvider>
          <ThemeEffects />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
