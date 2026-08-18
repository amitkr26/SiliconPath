"use client";

import PublicProfile from "@/components/profile/PublicProfile";
import { FEATURES } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/shared/ComingSoon";

// Legacy route — canonical public profiles live at /profile/{username}.
// Kept working (username OR profile id, via the API) for existing links.
// Note: params is a plain object in Next 14 client pages — React 18.3's use()
// throws on non-Thenables, so destructure directly.
export default function PeopleProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

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
