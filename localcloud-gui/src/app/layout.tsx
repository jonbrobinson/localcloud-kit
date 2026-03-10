import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PreferencesProvider } from "@/context/PreferencesContext";

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
    <html lang="en">
      <body className="antialiased font-sans">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
