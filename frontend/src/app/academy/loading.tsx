import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AcademyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-10 w-64 mb-4" />
      <LoadingSkeleton className="h-4 w-96 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-4">
            <LoadingSkeleton className="h-8 w-8 rounded-lg" />
            <LoadingSkeleton className="h-6 w-3/4" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <LoadingSkeleton className="h-6 w-20 rounded-full" />
              <LoadingSkeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
