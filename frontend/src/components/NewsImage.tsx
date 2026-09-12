"use client";

import ImageWithFallback from "@/components/ui/ImageWithFallback";

interface Props {
  src?: string | null;
  alt: string;
  sourceName?: string;
  category?: string;
  date?: string;
}

export default function NewsImage({ src, alt, sourceName, category, date }: Props) {
  return (
    <div className="w-full h-64 sm:h-80 overflow-hidden relative bg-slate-900">
      <ImageWithFallback
        src={src}
        alt={alt}
        name={sourceName || alt}
        variant="editorial"
        width={900}
        height={400}
        className="w-full h-full object-cover"
        editorialMeta={{
          sourceName: sourceName || "Semiconductor Editorial",
          category: category || "Semiconductor",
          date,
        }}
      />
    </div>
  );
}
