import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-text-primary">Profile Not Found</h1>
      <p className="text-text-secondary mt-2">
        No one with this handle has set up a public profile yet. Check the spelling or explore
        opportunities while you&apos;re here.
      </p>
      <Link
        href="/opportunities"
        className="mt-6 inline-block bg-accent text-bg-primary font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-accent-hover transition-colors"
      >
        Back to Opportunities
      </Link>
    </div>
  );
}
