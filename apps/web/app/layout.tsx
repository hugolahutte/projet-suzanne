import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Suzanne — La curiosité n’a pas d’âge",
  description:
    "Ton espace pour apprendre, découvrir et comprendre, tout au long de la vie.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Suzanne" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#254d42",
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
