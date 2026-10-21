import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} | ${SITE.network}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#040304",
    theme_color: "#040304",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
