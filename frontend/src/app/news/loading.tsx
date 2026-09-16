import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <LoadingSkeleton className="h-6 w-32 rounded-full" />
            <LoadingSkeleton className="h-12 w-3/4 rounded-xl" />
            <LoadingSkeleton className="h-6 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-5">
            <LoadingSkeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <LoadingSkeleton className="h-44 w-full rounded-xl" />
              <LoadingSkeleton className="h-4 w-1/3 rounded" />
              <LoadingSkeleton className="h-5 w-full rounded" />
              <LoadingSkeleton className="h-4 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
