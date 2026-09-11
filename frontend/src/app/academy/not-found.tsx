import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AcademyNotFound() {
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-500">404</span>
        </div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-gray-400 text-sm">
          This track or page doesn&apos;t exist. Check the URL or browse all available learning paths.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/academy"
            className="px-5 py-2.5 bg-cyan text-navy font-semibold rounded-lg text-sm hover:bg-cyan/90 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Academy
          </Link>
        </div>
      </div>
    </div>
  );
}
