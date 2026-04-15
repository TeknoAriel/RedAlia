"use client";

import Link from "next/link";

export default function PropiedadesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy">Propiedades</h1>
      <p className="mt-4 text-muted">
        En este momento no pudimos cargar el listado. Podés intentar de nuevo o escribirnos para orientarte sobre
        publicaciones y socios.
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
          href="/contacto"
          className="inline-flex rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
        >
          Ir a contacto
        </Link>
      </div>
    </div>
  );
}
