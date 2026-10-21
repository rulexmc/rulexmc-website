import { ImageResponse } from "next/og";
import { heartCells, loadOgFonts } from "@/lib/og-fonts";
import { SERVER_FACTS } from "@/lib/site";

export const alt = "RuleX MC: Your heart. Your survival.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const fonts = await loadOgFonts();
  const px = 22;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          backgroundColor: "#040304",
          backgroundImage: "radial-gradient(circle at 88% 0%, rgba(165,12,31,0.6), rgba(4,3,4,0) 55%), radial-gradient(circle at 0% 100%, rgba(114,8,22,0.55), rgba(4,3,4,0) 50%)",
          color: "#f5efef", padding: "64px 72px", fontFamily: "Rajdhani",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", position: "relative", width: 7 * px, height: 6 * px }}>
            {heartCells().map((c) => (
              <div key={`${c.x}-${c.y}`} style={{ position: "absolute", left: c.x * px, top: c.y * px, width: px, height: px, background: c.color }} />
            ))}
          </div>
          <div style={{ display: "flex", fontFamily: "Orbitron", fontSize: 84, letterSpacing: 4 }}>
            <span>RULE</span><span style={{ color: "#f0414f" }}>X</span><span style={{ marginLeft: 26 }}>MC</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Orbitron", fontSize: 76, lineHeight: 1.05 }}>YOUR HEART.</div>
          <div style={{ display: "flex", fontFamily: "Orbitron", fontSize: 76, lineHeight: 1.05, color: "#f0414f" }}>YOUR SURVIVAL.</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 36, color: "#e3dadb", letterSpacing: 3 }}>
            LIFESTEAL · SURVIVAL · PVP PRACTICE
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, border: "2px solid rgba(208,18,41,0.7)", borderRadius: 16, padding: "14px 26px", background: "rgba(208,18,41,0.12)" }}>
            <span style={{ fontSize: 24, color: "#a3979a", letterSpacing: 4 }}>IP</span>
            <span style={{ fontSize: 42, letterSpacing: 2 }}>{SERVER_FACTS.javaAddress}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 28, color: "#a3979a", letterSpacing: 3 }}>
            <span>JAVA + BEDROCK · {SERVER_FACTS.versions}</span>
            <span>BEDROCK PORT {SERVER_FACTS.bedrockPort}</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
