import Link from "next/link";

export default function OpportunityNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-text-muted text-lg mb-2">
        Opportunity not found or has expired.
      </p>
      <Link
        href="/opportunities"
        className="text-cyan hover:underline text-sm font-medium"
      >
        Browse all opportunities &rarr;
      </Link>
    </div>
  );
}
