import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask AI — Semiconductor, VLSI & JRF Career Intelligence Assistant",
  description: "Ask questions about JRF eligibility, DST stipend guidelines, VLSI careers, semiconductor research, DRDO/ISRO recruitment, and verified openings in India.",
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/ask-ai",
  },
  openGraph: {
    title: "Ask AI — Deep-Tech & Semiconductor Career Intelligence",
    description: "AI-powered career and research guidance for electronics engineers, JRF applicants, and VLSI professionals.",
    url: "https://berojgardegreewala.vercel.app/ask-ai",
  },
};

export default function AskAiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BerojgarDegreeWala AI Career Assistant",
    url: "https://berojgardegreewala.vercel.app/ask-ai",
    applicationCategory: "CareerApplication",
    operatingSystem: "Web",
    description: "Interactive AI assistant providing real-time guidance on semiconductor careers, VLSI opportunities, and JRF fellowships.",
    provider: {
      "@type": "Organization",
      name: "BerojgarDegreeWala",
      url: "https://berojgardegreewala.vercel.app",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      {children}
    </>
  );
}
