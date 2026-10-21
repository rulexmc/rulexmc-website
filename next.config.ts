import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js App Router injects inline bootstrap scripts; dev mode additionally needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mc-heads.net https://crafatar.com",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com https://*.tebex.io",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  // Docker builds set NEXT_OUTPUT=standalone for a minimal runtime image; Vercel / `next start` use the default.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  // Always render <title>/meta tags in the initial <head> (no streamed metadata) so every crawler
  // and link-preview bot sees them.
  htmlLimitedBots: /.*/,
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mc-heads.net" },
      { protocol: "https", hostname: "crafatar.com" },
    ],
  },
  async redirects() {
    // Short, shareable link to the community Discord (override the target with DISCORD_URL).
    const discord = process.env.DISCORD_URL?.trim() || "https://discord.com/invite/aBg5Wrp4U4";
    return /^https:\/\//.test(discord) ? [{ source: "/discord", destination: discord, permanent: false }] : [];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
