import { Cinzel, Source_Sans_3, EB_Garamond } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["500","600"], variable: "--font-cinzel" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], style: ["normal","italic"], variable: "--font-garamond" });

export const metadata: Metadata = {
  title: "Diario de un Aventurero",
  description: "Tu crónica personal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aventurero"
  }
};

export const viewport: Viewport = {
  themeColor: "#1c1310"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX"><body className={`${cinzel.variable} ${sourceSans.variable} ${ebGaramond.variable}`}>{children}</body></html>;
}
