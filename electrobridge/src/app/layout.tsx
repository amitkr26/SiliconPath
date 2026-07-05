import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
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
    default: "SiliconPath — Semiconductor, VLSI & Electronics Opportunities India",
    template: "%s | SiliconPath",
  },
  description:
    "Find JRF, PhD positions, government research jobs, fellowships, and private sector opportunities in semiconductor, VLSI, and electronics industry. DRDO, ISRO, CSIR, IIT opportunities aggregated in one place.",
  keywords: [
    "JRF", "Junior Research Fellow", "electronics jobs India", "semiconductor jobs",
    "DRDO recruitment", "ISRO JRF", "CSIR fellowship", "PhD electronics India",
    "VLSI jobs", "ASIC design jobs", "embedded systems jobs", "research fellowship India",
    "NET electronics jobs", "GATE electronics jobs", "SiliconPath", "semiconductor India",
  ],
  authors: [{ name: "SiliconPath" }],
  creator: "SiliconPath",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://siliconpath.vercel.app",
    siteName: "SiliconPath",
    title: "SiliconPath — Semiconductor & VLSI Opportunities Aggregator",
    description:
      "One-stop platform for JRF, PhD, government and private sector opportunities in semiconductor, VLSI, and electronics industry.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SiliconPath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SiliconPath — Semiconductor & Electronics Opportunities",
    description:
      "Find JRF, PhD, DRDO, ISRO, CSIR opportunities in VLSI & semiconductor. Updated daily.",
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
    },
  },
  alternates: { canonical: "https://siliconpath.vercel.app" },
  verification: {
    google: "QnEIBEpKxP_ZiQxtneegX-6WWKxO_FZ8Yzzxp4kOqxA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body bg-navy text-text-primary min-h-screen`}
      >
        <AppLayout>{children}</AppLayout>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' } }} />
        <Script defer data-domain="siliconpath.vercel.app" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
