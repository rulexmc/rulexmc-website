import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Fonts for next/og image routes (OFL-licensed, bundled in src/assets/fonts). */
export async function loadOgFonts() {
  const dir = join(process.cwd(), "src/assets/fonts");
  const [orbitron, rajdhani] = await Promise.all([
    readFile(join(dir, "Orbitron-Black.ttf")),
    readFile(join(dir, "Rajdhani-Bold.ttf")),
  ]);
  return [
    { name: "Orbitron", data: orbitron, weight: 900 as const, style: "normal" as const },
    { name: "Rajdhani", data: rajdhani, weight: 700 as const, style: "normal" as const },
  ];
}

const HEART = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];

/** Pixel heart cells for og/icon rendering (same art as the site logo). */
export function heartCells(): { x: number; y: number; color: string }[] {
  const cells: { x: number; y: number; color: string }[] = [];
  HEART.forEach((row, y) =>
    row.split("").forEach((c, x) => {
      if (c !== "1") return;
      let color = (x + y) % 3 === 0 ? "#f0414f" : y > 3 ? "#720816" : "#d01229";
      if (x === 1 && y === 1) color = "#ffc2c6";
      cells.push({ x, y, color });
    }),
  );
  return cells;
}
