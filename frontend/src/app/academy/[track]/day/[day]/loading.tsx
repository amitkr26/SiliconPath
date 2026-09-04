import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function DayLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LoadingSkeleton className="h-4 w-40 mb-6" />
      <LoadingSkeleton className="h-8 w-80 mb-2" />
      <LoadingSkeleton className="h-4 w-64 mb-8" />
      <div className="space-y-6">
        <div className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-4">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-3/4" />
        </div>
        <div className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-4">
          <LoadingSkeleton className="h-5 w-32" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-2/3" />
        </div>
        <div className="bg-navy-light border border-gray-800 rounded-xl p-6 space-y-4">
          <LoadingSkeleton className="h-5 w-36" />
          <LoadingSkeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
