import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-7xl font-bold text-cyan mb-4">404</h1>
      <p className="text-xl text-text-primary font-medium mb-2">Page Not Found</p>
      <p className="text-text-muted mb-8">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-cyan text-navy font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-cyan/90 transition-colors"
      >
        &larr; Back to ElectroBridge
      </Link>
    </div>
  );
}
