"use client";

import { useState } from "react";

type Props = {
  title: string;
  src: string | null;
};

export function VideoPreviewModalCard({ title, src }: Props) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <article className="rounded-2xl border border-brand-navy/10 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">{title}</p>
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-brand-navy/10 bg-brand-navy-soft/20 px-5 text-center">
          <p className="text-sm text-muted">Video institucional próximamente disponible.</p>
        </div>
      </article>
    );
  }

  return (
    <>
      <article className="rounded-2xl border border-brand-navy/10 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">{title}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block w-full text-left"
          aria-label={`Abrir ${title} en pantalla emergente`}
        >
          <video
            preload="metadata"
            className="aspect-video w-full max-h-[220px] rounded-xl border border-brand-navy/10 bg-black/90 object-cover"
            src={src}
          />
          <span className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep group-hover:underline">
            Abrir en pantalla emergente
          </span>
        </button>
      </article>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-black p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <video
              controls
              autoPlay
              preload="metadata"
              className="max-h-[78vh] w-full rounded-xl bg-black object-contain"
              src={src}
            >
              Tu navegador no soporta video HTML5.
            </video>
          </div>
        </div>
      )}
    </>
  );
}
