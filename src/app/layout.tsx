import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import ThemeEffects from "@/components/ThemeEffects";
import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F46E5" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

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
          <MobileBottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
