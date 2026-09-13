import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Editorial Support",
  description:
    "Get in touch with the BerojgarDegreeWala editorial team. Submit missing opportunities, report broken links, or discuss institutional partnerships.",
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact BerojgarDegreeWala",
    url: "https://berojgardegreewala.vercel.app/contact",
    description: "Submit missing opportunities, report broken circular links, or reach out to our research intelligence team.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Contact", item: "https://berojgardegreewala.vercel.app/contact" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
