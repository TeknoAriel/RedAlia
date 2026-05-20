"use client";

import Link from "next/link";

export default function SociosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-xl font-semibold text-brand-navy">No pudimos cargar el directorio</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        El servidor tardó demasiado o hubo un fallo temporal. Probá de nuevo; si el catálogo acaba de actualizarse,
        la segunda carga suele ser más rápida.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-mid"
        >
          Reintentar
        </button>
        <Link
          href="/propiedades"
          className="inline-flex rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
        >
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
