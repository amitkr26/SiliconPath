import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { PUBLIC_PROFILE_FIELDS } from "@/lib/utils";
import PublicProfile from "@/components/profile/PublicProfile";

interface Props {
  params: Promise<{ username: string }>;
}

// No generateStaticParams + no revalidate => dynamic render, so profile
// edits (username, headline, skills) show up immediately. Fine at this scale.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("username, display_name, headline, bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!data) return { title: "Profile Not Found" };

  const canonical = `/profile/${data.username}`;
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

export default async function ProfileByUsernamePage({ params }: Props) {
  const { username } = await params;
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  return <PublicProfile username={username.toLowerCase()} initialProfile={profile} notFoundBackHref="/opportunities" />;
}
