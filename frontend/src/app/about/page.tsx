import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us — Verified Student Opportunities & Research Platform",
  description:
    "Learn about BerojgarDegreeWala — India's student-first platform connecting learners with verified internships, research positions, scholarships, and jobs.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/about" },
  openGraph: {
    title: "About BerojgarDegreeWala",
    description:
      "A brighter tomorrow for every learner. Free verified opportunities in research, internships, and engineering.",
    url: "https://berojgardegreewala.vercel.app/about",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BerojgarDegreeWala",
    url: "https://berojgardegreewala.vercel.app",
    description: "A brighter tomorrow for every learner — verified opportunities platform",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://berojgardegreewala.vercel.app/opportunities?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
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
        name: "About Us",
        item: "https://berojgardegreewala.vercel.app/about",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is BerojgarDegreeWala free for students?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! BerojgarDegreeWala is 100% free for students and job-seekers. You can explore, filter, bookmark, and apply for opportunities without any hidden fees or paywalls.",
        },
      },
      {
        "@type": "Question",
        name: "How are opportunities verified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our multi-tiered verification pipeline aggregates circulars directly from official DRDO, ISRO, CSIR, and IIT portals, runs automated link sanity tests, and performs editorial reviews before marking listings verified.",
        },
      },
      {
        "@type": "Question",
        name: "Can organizations post opportunities directly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Premier universities, research labs, and verified technology enterprises can partner with BDW to post research internships, JRF vacancies, and entry-level engineering roles.",
        },
      },
      {
        "@type": "Question",
        name: "How frequently is content updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our feeds synchronize daily for research fellowships, semiconductor news, and career opportunities, ensuring you never miss critical application deadlines.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AboutClient />
    </>
  );
}
