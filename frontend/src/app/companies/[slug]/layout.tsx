import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  return {
    title: "Company Profile",
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `https://berojgardegreewala.vercel.app/organizations/${slug}`,
    },
  };
}

export default function CompanyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
