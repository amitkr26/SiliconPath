import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PUBLIC_PROFILE_FIELDS } from "@/lib/utils";
import PublicProfile from "@/components/profile/PublicProfile";

interface Props {
  params: Promise<{ username: string }>;
}

// No generateStaticParams + no revalidate => dynamic render, so profile
// edits (username, headline, skills) show up immediately. Fine at this scale.
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const username = params?.username;
  if (!username) return { title: "Profile Not Found" };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
  const query = supabaseAdmin.from("user_profiles").select("username, display_name, headline, bio");
  const { data } = isUuid
    ? await query.eq("id", username).maybeSingle()
    : await query.eq("username", username.toLowerCase()).maybeSingle();

  if (!data) return { title: "Profile Not Found" };

  const canonical = `/profile/${data.username || username}`;
  const description = data.headline || (data.bio || "").slice(0, 160);

  return {
    title: data.display_name,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${data.display_name}`,
      description,
      url: canonical,
    },
  };
}

export default async function ProfileByUsernamePage({ params }: { params: { username: string } }) {
  const username = params?.username;
  if (!username) notFound();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
  const query = supabaseAdmin.from("user_profiles").select(PUBLIC_PROFILE_FIELDS);
  const { data: profile } = isUuid
    ? await query.eq("id", username).maybeSingle()
    : await query.eq("username", username.toLowerCase()).maybeSingle();

  if (!profile) notFound();

  return <PublicProfile username={profile.username || username} initialProfile={profile} notFoundBackHref="/opportunities" />;
}
