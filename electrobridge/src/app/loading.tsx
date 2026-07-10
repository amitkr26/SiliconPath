export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content items-center justify-center px-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
