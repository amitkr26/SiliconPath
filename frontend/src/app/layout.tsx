import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import Providers from "@/components/Providers";
import { AuthSync } from "@/components/AuthSync";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://siliconpath.vercel.app"),
  title: {
    default: "SiliconPath — VLSI Academy & Hardware Network",
    template: "%s | SiliconPath",
  },
  description:
    "The premier platform for Verilog, SystemVerilog, UVM, Physical Design, and RTL verification. Master VLSI tracks and connect with hardware engineers worldwide.",
  keywords: [
    "VLSI Academy", "Verilog HDL", "SystemVerilog UVM", "Physical Design",
    "RTL Verification", "Hardware Engineers Network", "ASIC Design", "SiliconPath",
  ],
  authors: [{ name: "SiliconPath" }],
  creator: "SiliconPath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://siliconpath.vercel.app",
    siteName: "SiliconPath",
    title: "SiliconPath — VLSI Academy & Hardware Network",
    description:
      "Structured VLSI learning paths & professional network for semiconductor hardware engineers.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SiliconPath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SiliconPath — VLSI Academy & Hardware Network",
    description:
      "Master VLSI design, SystemVerilog, UVM, and connect with hardware engineers.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "noarchive": true
    },
  },
  alternates: { canonical: "https://berojgardegreewala.vercel.app" },
  verification: {
    google: "QnEIBEpKxP_ZiQxtneegX-6WWKxO_FZ8Yzzxp4kOqxA",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body bg-navy text-text-primary min-h-screen`}
      >
        <AuthSync />
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' } }} />
        <Script defer data-domain="berojgardegreewala.vercel.app" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
