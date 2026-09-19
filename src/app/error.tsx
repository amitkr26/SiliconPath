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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-slate-900 shadow-brutal-sm flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-slate-600 text-sm mb-8 max-w-md font-medium">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset} size="lg">
          <RotateCcw className="w-4 h-4" /> Try again
        </Button>
        <Button href="/" variant="secondary" size="lg">
          <Home className="w-4 h-4" /> Return Home
        </Button>
      </div>
    </div>
  );
}
