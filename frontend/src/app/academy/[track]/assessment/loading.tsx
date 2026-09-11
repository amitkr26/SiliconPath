import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AssessmentLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-4 w-40 mb-6" />
      <LoadingSkeleton className="h-8 w-72 mb-2" />
      <LoadingSkeleton className="h-4 w-64 mb-8" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-4">
            <LoadingSkeleton className="h-4 w-full" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-10 w-full rounded-lg" />
              <LoadingSkeleton className="h-10 w-full rounded-lg" />
              <LoadingSkeleton className="h-10 w-full rounded-lg" />
              <LoadingSkeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
