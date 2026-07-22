import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function NewsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-3">
            <LoadingSkeleton className="h-4 w-1/3" />
            <LoadingSkeleton className="h-5 w-full" />
            <LoadingSkeleton className="h-4 w-5/6" />
            <LoadingSkeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
