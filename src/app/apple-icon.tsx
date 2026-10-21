import { ImageResponse } from "next/og";
import { heartCells } from "@/lib/og-fonts";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const px = 18;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#040304", backgroundImage: "radial-gradient(circle at 50% 30%, #2a0308, #040304 75%)" }}>
        <div style={{ display: "flex", position: "relative", width: 7 * px, height: 6 * px, marginTop: 8 }}>
          {heartCells().map((c) => (
            <div key={`${c.x}-${c.y}`} style={{ position: "absolute", left: c.x * px, top: c.y * px, width: px, height: px, background: c.color }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
