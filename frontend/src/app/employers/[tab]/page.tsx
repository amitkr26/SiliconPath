"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EmployersTabRedirect() {
  const router = useRouter();
  const params = useParams();
  const tab = params?.tab as string;

  useEffect(() => {
    if (tab === "postings") {
      router.replace("/employer/dashboard");
    } else if (tab === "applicants") {
      router.replace("/employer/dashboard?tab=applicants");
    } else if (tab === "profile") {
      router.replace("/employer/dashboard?tab=profile");
    } else {
      router.replace("/employer/dashboard");
    }
  }, [router, tab]);

  return (
    <div className="min-h-[60vh] bg-[#FAF9F6] flex items-center justify-center p-8">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}
