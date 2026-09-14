"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-16 bg-slate-50/40">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-rose-600" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-slate-600 text-xs sm:text-sm mb-8 max-w-md font-normal">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} size="md" className="shadow-sm">
          <RotateCcw className="w-4 h-4" /> Try again
        </Button>
        <Button href="/" variant="secondary" size="md">
          <Home className="w-4 h-4" /> Return Home
        </Button>
      </div>
    </div>
  );
}
