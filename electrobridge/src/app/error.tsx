"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-text">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        We hit an unexpected error loading this page. You can retry, or head back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-raised"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
