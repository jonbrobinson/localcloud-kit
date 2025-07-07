import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalCloud Kit",
  description: "Enterprise AWS Development Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
