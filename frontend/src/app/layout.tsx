import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://siliconpath.vercel.app"),
  title: {
    default: "SiliconPath — VLSI Opportunities Aggregator & Academy",
    template: "%s | SiliconPath",
  },
  description:
    "Aggregated JRF, PhD, fellowship, government and industry opportunities for VLSI, semiconductor and hardware engineers, plus a free structured VLSI learning academy.",
  keywords: [
    "VLSI Academy", "Verilog HDL", "SystemVerilog UVM", "Physical Design",
    "RTL Verification", "JRF PhD opportunities", "Semiconductor jobs", "SiliconPath",
  ],
  authors: [{ name: "SiliconPath" }],
  creator: "SiliconPath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://siliconpath.vercel.app",
    siteName: "SiliconPath",
    title: "SiliconPath — VLSI Opportunities & Academy",
    description:
      "Aggregated VLSI career opportunities and a free structured VLSI learning academy.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SiliconPath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SiliconPath — VLSI Opportunities & Academy",
    description:
      "Aggregated VLSI career opportunities and a free structured VLSI learning academy.",
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
  alternates: { canonical: "https://siliconpath.vercel.app" },
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
        <AppLayout>{children}</AppLayout>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' } }} />
      </body>
    </html>
  );
}
