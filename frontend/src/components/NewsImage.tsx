"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
}

export default function NewsImage({ src, alt }: Props) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-64 sm:h-80 object-cover"
      onError={() => setHidden(true)}
    />
  );
}
