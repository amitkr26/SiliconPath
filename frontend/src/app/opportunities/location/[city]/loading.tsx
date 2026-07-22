import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function LocationLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-10 w-64 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-3">
            <LoadingSkeleton className="h-5 w-3/4" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
