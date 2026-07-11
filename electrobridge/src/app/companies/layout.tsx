// Force /companies to render at request time, not at build.
// The page is a client component that constructs a Supabase client on render;
// static prerendering at build (where CI has no real Supabase env) throws
// "@supabase/ssr: Your project's URL and API key are required". This segment
// config opts the whole route out of static generation.
export const dynamic = "force-dynamic";

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
