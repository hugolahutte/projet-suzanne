import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./refresh.css";
import "./club.css";
export const metadata: Metadata = {
  title: "Suzanne — La curiosité n’a pas d’âge",
  description:
    "Ton espace pour apprendre, découvrir et comprendre, tout au long de la vie.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Suzanne" },
  icons: { icon: "/brand/suzanne-embleme.png", apple: "/icon-192.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#35264c",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
