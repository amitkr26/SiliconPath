import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://siliconpath.vercel.app"),
  title: {
    default: "SiliconPath — Global Semiconductor & VLSI Careers + Learning",
    template: "%s | SiliconPath",
  },
  description:
    "One place for semiconductor, VLSI, and hardware opportunities worldwide — research fellowships, PhDs, government roles, and industry jobs — plus a free self-paced VLSI academy. No login required.",
  keywords: ["VLSI", "semiconductor", "JRF", "PhD", "chip design", "careers", "academy"],
  openGraph: {
    title: "SiliconPath",
    description: "Global semiconductor & VLSI opportunities and free learning, all in one place.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
