export default function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-border/60 ${className}`}
    />
  );
}
