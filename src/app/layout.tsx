import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getConfig } from "@/lib/config";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-orbitron", display: "swap" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-rajdhani", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const cfg = getConfig();
  return {
    metadataBase: new URL(cfg.siteUrl),
    title: { default: `${cfg.siteName} — Lifesteal SMP`, template: `%s · ${cfg.siteName}` },
    description: "Your heart. Your survival. A competitive Lifesteal SMP for Minecraft: Java Edition.",
    openGraph: { title: `${cfg.siteName} — Lifesteal SMP`, description: "Steal hearts. Survive. Dominate the leaderboards.", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#050405", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
