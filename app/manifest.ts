export const dynamic = "force-static";

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MESSIE MATALA POS",
    short_name: "MESSIE MATALA POS",

    description:
      "ERP POS MESSIE MATALA - Gestion des ventes, stocks, clients, caisse et inventaire",

    start_url: "/dashboard",

    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#0f172a",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}