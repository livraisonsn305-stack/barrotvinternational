import type { MetadataRoute } from "next";

const SITE_URL = "https://www.barrotvinternational.com";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barro TV International",
    short_name: "Barro TV",
    description: "L'actualité du Sénégal, de l'Afrique et du monde.",
    start_url: SITE_URL,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111b35",
    lang: "fr",
    icons: [
      { src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { src: "/icon.png", sizes: "48x48", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}