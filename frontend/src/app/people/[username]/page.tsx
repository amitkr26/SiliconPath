"use client";

import { use } from "react";
import PublicProfile from "@/components/profile/PublicProfile";
import { FEATURES } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/shared/ComingSoon";

// Legacy route — canonical public profiles live at /profile/{username}.
// Kept working (username OR profile id, via the API) for existing links.
export default function PeopleProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  if (!FEATURES.LINKEDIN_ENABLED) {
    return (
      <ComingSoon
        feature="Public Profile"
        description="View professional headlines, research summaries, skill endorsements, and peer recommendations."
      />
    );
  }

  return <PublicProfile username={username} />;
}
