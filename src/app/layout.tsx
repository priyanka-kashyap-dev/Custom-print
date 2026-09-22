import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Prints | Premium Custom Personalized Gifts",
  description: "Turn your favorite moments, photos and ideas into beautifully printed gifts. Premium custom t-shirts, cushions, and personalized photo gifts.",
  openGraph: {
    title: "Lumina Prints | Premium Custom Personalized Gifts",
    description: "Turn your favorite moments, photos and ideas into beautifully printed gifts.",
    url: "https://luminaprints.example.com",
    siteName: "Lumina Prints",
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
      <body>{children}</body>
    </html>
  );
}
