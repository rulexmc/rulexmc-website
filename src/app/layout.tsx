import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { getConfig } from "@/lib/config";
import { SITE } from "@/lib/site";
import { OG_IMAGE } from "@/lib/seo";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-orbitron", display: "swap" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-rajdhani", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const cfg = getConfig();
  const defaultTitle = `${cfg.siteName} | Lifesteal, Survival & PvP Practice`;
  return {
    metadataBase: new URL(cfg.siteUrl),
    title: { default: defaultTitle, template: `%s | ${cfg.siteName}` },
    description: SITE.description,
    applicationName: cfg.siteName,
    keywords: [
      "RuleX MC", "RuleX Network", "Minecraft server", "Lifesteal SMP", "Minecraft Lifesteal", "Survival SMP",
      "PvP practice", "crossplay Minecraft server", "Java Bedrock server", "cracked Minecraft server", "India Minecraft server",
      "rulexmc.mcsh.io",
    ],
    authors: [{ name: SITE.owner }],
    creator: SITE.owner,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: cfg.siteName,
      locale: "en_US",
      url: "/",
      title: defaultTitle,
      description: SITE.description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: defaultTitle, description: SITE.description, images: [OG_IMAGE.url] },
    formatDetection: { telephone: false, address: false, email: false },
    category: "games",
  };
}

export const viewport: Viewport = { themeColor: "#040304", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="btn-red btn-sm sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60]">
          Skip to content
        </a>
        <Header />
        {/* min-height keeps the footer below the fold while streamed page content arrives (prevents layout shift). */}
        <main id="main" tabIndex={-1} className="min-h-[calc(100svh-4rem)] flex-1 focus:outline-none">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
