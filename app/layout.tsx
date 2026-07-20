import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MESSIE MATALA POS",
    template: "%s | MESSIE MATALA POS",
  },
  description:
    "ERP POS MESSIE MATALA - Gestion complète des ventes, stocks, clients, employés et caisse.",
  applicationName: "MESSIE MATALA POS",
  manifest: "/manifest.webmanifest",
  keywords: [
    "MESSIE MATALA POS",
    "ERP",
    "POS",
    "Gestion Stock",
    "Gestion Ventes",
    "Caisse",
    "Inventaire",
  ],
  authors: [{ name: "Messie Matala" }],
  creator: "Messie Matala",
  publisher: "ZAIRE",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "MESSIE MATALA POS",
    description:
      "ERP POS MESSIE MATALA - Gestion complète des ventes, stocks et caisse.",
    siteName: "MESSIE MATALA POS",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1210" },
  ],
};

/*
 * Exécuté avant l'affichage de React pour éviter le flash du thème clair.
 * La même clé est utilisée par le bouton Apparence de la page d'accueil.
 */
const appearanceScript = `
  (function () {
    try {
      var key = "ZAIRE_APPEARANCE";
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var root = document.documentElement;

      function applyAppearance(choice) {
        var validChoice = choice === "light" || choice === "dark" || choice === "system"
          ? choice
          : "system";
        var isDark = validChoice === "dark" || (validChoice === "system" && media.matches);

        root.classList.toggle("dark", isDark);
        root.dataset.theme = isDark ? "dark" : "light";
        root.style.colorScheme = isDark ? "dark" : "light";
      }

      applyAppearance(localStorage.getItem(key) || "system");

      media.addEventListener("change", function () {
        var choice = localStorage.getItem(key) || "system";
        if (choice === "system") applyAppearance(choice);
      });

      window.addEventListener("storage", function (event) {
        if (event.key === key) applyAppearance(event.newValue || "system");
      });
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}