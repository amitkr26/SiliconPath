"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "candidate" | "employer" | "admin";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfileAndRole = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setRole("candidate");
      setUsername("");
      setDisplayName("");
      return;
    }

    // 1. Initial resolution from user_metadata
    const metaRole = authUser.user_metadata?.role || authUser.user_metadata?.account_type;
    const metaUsername = authUser.user_metadata?.username || authUser.email?.split("@")[0] || "";
    const metaDisplayName = authUser.user_metadata?.full_name || metaUsername;

    let determinedRole: UserRole = "candidate";
    if (metaRole === "employer" || metaRole === "provider") {
      determinedRole = "employer";
    } else if (metaRole === "admin") {
      determinedRole = "admin";
    }

    setRole(determinedRole);
    setUsername(metaUsername);
    setDisplayName(metaDisplayName);

    // 2. Fetch from user_profiles table for active database sync
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("account_type, username, display_name")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.username) setUsername(profile.username);
        if (profile.display_name) setDisplayName(profile.display_name);

        if (profile.account_type) {
          const pRole = profile.account_type.toLowerCase();
          if (pRole === "employer" || pRole === "provider") {
            setRole("employer");
          } else if (pRole === "admin") {
            setRole("admin");
          }
        }
      }
    } catch {
      // Fallback already set from metadata
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      fetchProfileAndRole(currentUser).then(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchProfileAndRole(currentUser);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
    setDisplayName("");
    setRole("candidate");
    router.push("/");
    router.refresh();
  }, [router]);

  return {
    user,
    username,
    displayName,
    role,
    isCandidate: role === "candidate",
    isEmployer: role === "employer",
    isAdmin: role === "admin",
    loading,
    signOut,
  };
}
