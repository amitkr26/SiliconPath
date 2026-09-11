export default function AssessmentLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
      <p className="mt-4 text-slate-600 text-sm font-medium">Loading assessment...</p>
    </div>
  );
}
