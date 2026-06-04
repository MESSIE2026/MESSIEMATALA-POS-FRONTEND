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
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
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
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-slate-100 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}