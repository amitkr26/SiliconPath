"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Check, ArrowRight } from "lucide-react";

export default function OpenToWorkBanner() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/profile/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.is_open_to_work) setUser(data.profile);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading || !user) return null;

  return (
    <div className="bg-success/10 border border-success/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-4 h-4 text-success" />
        </div>
        <div className="min-w-0">
          <p className="text-success text-sm font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Open to Work
          </p>
          <p className="text-text-muted text-xs mt-0.5">
            You&apos;re open to {user.open_to_work_types?.join(", ") || "opportunities"}. This role matches your profile.
          </p>
        </div>
      </div>
      <Link
        href="/profile"
        className="mt-3 flex items-center justify-center gap-1 bg-success/20 text-success text-xs font-medium rounded-lg py-2 hover:bg-success/30 transition-colors"
      >
        Update preferences <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
