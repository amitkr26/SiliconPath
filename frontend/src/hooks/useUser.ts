"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "candidate" | "employer" | "admin";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("candidate");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRole = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setRole("candidate");
      return;
    }

    // 1. Check user_metadata
    const metaRole = authUser.user_metadata?.role || authUser.user_metadata?.account_type;
    if (metaRole === "employer" || metaRole === "provider") {
      setRole("employer");
      return;
    }
    if (metaRole === "admin") {
      setRole("admin");
      return;
    }

    // 2. Fallback check user_profiles database table
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("account_type")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile?.account_type) {
        const pRole = profile.account_type.toLowerCase();
        if (pRole === "employer" || pRole === "provider") {
          setRole("employer");
          return;
        }
        if (pRole === "admin") {
          setRole("admin");
          return;
        }
      }
    } catch {
      // Default to candidate
    }

    setRole("candidate");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      fetchRole(currentUser).then(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchRole(currentUser);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole("candidate");
    router.push("/");
    router.refresh();
  }, [router]);

  return {
    user,
    role,
    isCandidate: role === "candidate",
    isEmployer: role === "employer",
    isAdmin: role === "admin",
    loading,
    signOut,
  };
}
