import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies Directory",
  description: "Browse and follow semiconductor companies, fabless design houses, and hardware enterprises.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/organizations",
  },
};

export const dynamic = "force-dynamic";

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
