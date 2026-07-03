import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function OpportunityDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <LoadingSkeleton className="h-8 w-3/4" />
      <div className="flex gap-4">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="h-5 w-36" />
      </div>
      <LoadingSkeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
        <LoadingSkeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
