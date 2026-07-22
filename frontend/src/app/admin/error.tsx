"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Admin Panel Error</h1>
        <p className="text-gray-400 text-sm">
          Something went wrong. Please try again.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-cyan text-navy font-semibold rounded-lg text-sm hover:bg-cyan/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-lg text-sm hover:border-gray-600 transition-colors"
          >
            Reload
          </Link>
        </div>
      </div>
    </div>
  );
}
