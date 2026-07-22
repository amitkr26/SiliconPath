import Link from "next/link";

export default function NewsNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-text-muted text-lg mb-2">
        Article not found.
      </p>
      <Link
        href="/news"
        className="text-cyan hover:underline text-sm font-medium"
      >
        Browse all news &rarr;
      </Link>
    </div>
  );
}
