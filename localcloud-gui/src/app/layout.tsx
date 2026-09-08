import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PreferencesProvider } from "@/context/PreferencesContext";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LocalCloud Kit",
  description: "Local Cloud Development Environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="antialiased font-sans bg-bg text-ink">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
