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
  metadataBase: new URL("https://siliconpath.in"),
  title: {
    default: "SiliconPath — Learn VLSI Online",
    template: "%s | SiliconPath",
  },
  description:
    "Practical VLSI learning from RTL to GDSII — real workflows, tools, and interview-ready practice.",
  keywords: [
    "VLSI", "physical design", "STA", "synthesis", "Verilog", "semiconductor",
    "ASIC", "RTL design", "digital logic", "EDA", "OpenLane", "OpenROAD",
    "clock tree synthesis", "timing signoff", "DFT", "low power", "SiliconPath",
  ],
  authors: [{ name: "SiliconPath" }],
  creator: "SiliconPath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://siliconpath.in",
    siteName: "SiliconPath",
    title: "SiliconPath — Learn VLSI Online",
    description:
      "Practical VLSI learning from RTL to GDSII — real workflows, tools, and interview-ready practice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SiliconPath — Learn VLSI Online",
    description:
      "Practical VLSI learning from RTL to GDSII — real workflows, tools, and interview-ready practice.",
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
  alternates: { canonical: "https://siliconpath.in" },
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
        "@id": "https://siliconpath.in/#website",
        "url": "https://siliconpath.in",
        "name": "SiliconPath — Learn VLSI Online",
        "description": "Practical VLSI learning from RTL to GDSII — real workflows, tools, and interview-ready practice.",
        "inLanguage": "en-IN",
      },
      {
        "@type": "Organization",
        "@id": "https://siliconpath.in/#organization",
        "name": "SiliconPath",
        "url": "https://siliconpath.in",
        "logo": "https://siliconpath.in/icon.svg",
        "description": "VLSI learning platform covering physical design, STA, synthesis, Verilog, and design verification.",
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
