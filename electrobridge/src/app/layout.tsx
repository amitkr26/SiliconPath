import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://electrobridge.vercel.app"),
  title: {
    default: "ElectroBridge — Electronics & Semiconductor Opportunities India",
    template: "%s | ElectroBridge",
  },
  description:
    "Find JRF, PhD positions, government research jobs, and private sector opportunities in electronics and semiconductor industry. DRDO, ISRO, CSIR, IIT opportunities in one place.",
  keywords: [
    "JRF", "Junior Research Fellow", "electronics jobs India", "semiconductor jobs",
    "DRDO recruitment", "ISRO JRF", "CSIR fellowship", "PhD electronics India",
    "VLSI jobs", "embedded systems jobs", "research fellowship India",
    "NET electronics jobs", "GATE electronics jobs",
  ],
  authors: [{ name: "ElectroBridge" }],
  creator: "ElectroBridge",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://electrobridge.vercel.app",
    siteName: "ElectroBridge",
    title: "ElectroBridge — Electronics & Semiconductor Opportunities",
    description:
      "One-stop platform for JRF, PhD, government and private sector opportunities in electronics and semiconductor industry.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "ElectroBridge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElectroBridge — Electronics & Semiconductor Opportunities",
    description:
      "Find JRF, PhD, DRDO, ISRO, CSIR opportunities in electronics & semiconductor.",
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
  alternates: { canonical: "https://electrobridge.vercel.app" },
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
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', border: '1px solid #374151', color: '#F9FAFB' } }} />
        <Script defer data-domain="electrobridge.vercel.app" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
