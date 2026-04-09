"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export function PropertyGallery({ images, title }: Props) {
  const [idx, setIdx] = useState(0);
  const main = images[idx];

  if (!images.length) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-brand-navy-soft text-brand-navy/40">
        Sin fotografías disponibles
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-brand-navy-soft">
        <span className="img-tech-wrap relative block h-full w-full">
          <Image
            src={main}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        </span>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(0, 12).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === idx ? "border-brand-gold" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              aria-label={`${title} — foto ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
