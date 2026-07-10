import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOCAL — Interview Prep Commute",
    short_name: "LOCAL",
    description: "Turn the commute into interview prep.",
    id: "/",
    start_url: "/?src=pwa",
    display: "standalone",
    background_color: "#F6E9B8",
    theme_color: "#F6E9B8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
