import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suzanne — Apprendre toute la vie",
    short_name: "Suzanne",
    description: "La curiosité n’a pas d’âge.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f2",
    theme_color: "#254d42",
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
