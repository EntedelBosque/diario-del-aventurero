import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diario de un Aventurero",
  description: "Tu crónica personal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aventurero"
  },
  themeColor: "#101510"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX"><body>{children}</body></html>;
}
