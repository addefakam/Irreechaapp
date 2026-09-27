import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Irreecha GateGuard — Visitor ID Scanner",
  description: "Bilingual (English + Afaan Oromoo) national-ID QR scanner for Irreecha festival gate operators. Offline-first, with blocklist alerts and arrival analytics.",
  keywords: ["Irreecha", "Oromia", "Bishoftu", "national ID", "QR scanner", "visitor management", "PWA", "Ethiopia"],
  authors: [{ name: "Irreecha GateGuard" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GateGuard",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Irreecha GateGuard",
    description: "Visitor ID QR scanner for Irreecha festival gates",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B7A3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
