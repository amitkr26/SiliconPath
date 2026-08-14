import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { PUBLIC_PROFILE_FIELDS } from "@/lib/utils";
import ProfileEditor from "@/components/profile/ProfileEditor";

// Server component: resolves the logged-in user's own profile BEFORE any
// render. Users with a username get an instant server-side 307 to their
// canonical /profile/[username] — no client-side redirect, no flash of the
// editor template with placeholder content. Users without a profile row
// (or without a username yet) land on the setup/editor with real data only.
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  let profile: Record<string, unknown> | null = null;
  if (isAdminConfigured) {
    const { data } = await supabaseAdmin
      .from("user_profiles")
      .select(PUBLIC_PROFILE_FIELDS)
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  return (
    <ProfileEditor
      userId={user.id}
      initialProfile={profile as never}
      authName={(user.user_metadata?.full_name as string | undefined) || null}
    />
  );
}