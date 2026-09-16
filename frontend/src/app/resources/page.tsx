import type { Metadata } from "next";
import ResourcesClient from "./ResourcesClient";

export const metadata: Metadata = {
  title: "Resources — JRF Guide, PhD Guide, DRDO Labs, CSIR Research",
  description:
    "Comprehensive guide to JRF positions in India, PhD admissions, list of DRDO and CSIR labs for electronics research, NET vs GATE comparison, international fellowship programs, and more.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources" },
  openGraph: {
    title: "BerojgarDegreeWala Resources — JRF Guide & Research Information",
    description:
      "Step-by-step JRF application guide, PhD admission guide, NET vs GATE comparison, DRDO/CSIR lab directory, international fellowship programs for Indian researchers.",
    url: "https://berojgardegreewala.vercel.app/resources",
  },
};

export default function ResourcesPage() {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://berojgardegreewala.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resources",
        item: "https://berojgardegreewala.vercel.app/resources",
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Engineering & Research Resources",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JRF vs SRF vs RA Guide",
        url: "https://berojgardegreewala.vercel.app/resources/jrf-vs-srf-difference",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "DRDO Recruitment Guide",
        url: "https://berojgardegreewala.vercel.app/resources/drdo-recruitment-electronics",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Fully-Funded PhD Abroad",
        url: "https://berojgardegreewala.vercel.app/resources/fully-funded-phd-vlsi-abroad",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "VLSI Career Guide",
        url: "https://berojgardegreewala.vercel.app/resources/vlsi-careers",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <ResourcesClient />
    </>
  );
}
