import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://siliconpath.vercel.app"),
  title: {
    default: "SiliconPath — VLSI Academy & Learning Platform",
    template: "%s | SiliconPath",
  },
  description:
    "Master VLSI design, verification, and physical design through structured learning tracks. Digital Logic, Verilog, SystemVerilog, UVM, RTL, and Physical Design courses.",
  keywords: [
    "VLSI", "semiconductor", "Verilog", "SystemVerilog", "UVM", "RTL design",
    "physical design", "ASIC verification", "digital logic", "FPGA", "EDA",
    "open source ASIC", "Sky130", "OpenLane", "Yosys", "SiliconPath",
  ],
  authors: [{ name: "SiliconPath" }],
  creator: "SiliconPath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://siliconpath.vercel.app",
    siteName: "SiliconPath",
    title: "SiliconPath — VLSI Academy & Learning Platform",
    description:
      "Master VLSI design, verification, and physical design through structured learning tracks.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SiliconPath — VLSI Academy",
    description:
      "Structured VLSI learning tracks: Digital Logic → Verilog → SystemVerilog → UVM → RTL → Physical Design → Interview Prep.",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://siliconpath.vercel.app/#website",
        "url": "https://siliconpath.vercel.app",
        "name": "SiliconPath — VLSI Academy",
        "description": "Structured VLSI learning tracks for semiconductor design and verification.",
        "inLanguage": "en-IN",
      },
      {
        "@type": "Organization",
        "@id": "https://siliconpath.vercel.app/#organization",
        "name": "SiliconPath",
        "url": "https://siliconpath.vercel.app",
        "logo": "https://siliconpath.vercel.app/icon.svg",
        "description": "VLSI learning platform covering digital logic, Verilog, SystemVerilog, UVM, RTL design, and physical design.",
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body bg-[#FAF9F6] text-slate-900 min-h-screen`}
      >
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' } }} />
      </body>
    </html>
  );
}
