import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function TrackLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-4 w-32 mb-6" />
      <LoadingSkeleton className="h-8 w-72 mb-2" />
      <LoadingSkeleton className="h-4 w-96 mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-navy-light border border-gray-800 rounded-lg p-4 flex items-center gap-4">
            <LoadingSkeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton className="h-4 w-48" />
              <LoadingSkeleton className="h-3 w-32" />
            </div>
            <LoadingSkeleton className="h-6 w-6 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
