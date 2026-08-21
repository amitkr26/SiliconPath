"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EmployersTabRedirect() {
  const router = useRouter();
  const params = useParams();
  const tab = params?.tab as string;

  useEffect(() => {
    if (tab === "postings") {
      router.replace("/employer/jobs");
    } else if (tab === "applicants") {
      router.replace("/employer/applicants");
    } else if (tab === "profile") {
      router.replace("/employer/company");
    } else if (tab === "talent") {
      router.replace("/employer/talent");
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
