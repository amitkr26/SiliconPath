import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Opportunities & Intelligence",
  description: "Search semiconductor jobs, JRF positions, organizations, and hardware news on BerojgarDegreeWala.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
