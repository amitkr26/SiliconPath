"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-text-muted text-sm mb-6 max-w-md">
        An unexpected error occurred. Please try again or go back to the homepage.
      </p>
      {error.message && (
        <pre className="bg-navy-light border border-gray-800 rounded-lg px-4 py-3 text-xs text-text-muted mb-8 max-w-lg overflow-x-auto">
          {error.message}
        </pre>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-cyan text-navy font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-cyan/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-gray-700 text-text-primary font-medium rounded-lg px-6 py-2.5 text-sm hover:border-gray-600 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
