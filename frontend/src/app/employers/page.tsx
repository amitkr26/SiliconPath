"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employer/dashboard");
  }, [router]);

  return (
    <div className="min-h-[60vh] bg-[#FAF9F6] flex items-center justify-center p-8">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}
