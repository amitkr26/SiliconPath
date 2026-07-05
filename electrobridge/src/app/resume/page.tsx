// src/app/resume/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ResumePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile?tab=builder");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
      <p className="text-sm text-text-secondary">Redirecting to AI Resume Builder...</p>
    </div>
  );
}
