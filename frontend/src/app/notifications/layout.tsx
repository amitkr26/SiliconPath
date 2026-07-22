// Force /notifications to render at request time, not at build.
// Notifications are per-user data; static prerendering makes no sense here and
// the client component constructs a Supabase client on render, which throws at
// build time in CI (no Supabase env). This segment config opts the route out
// of static generation.
export const dynamic = "force-dynamic";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
