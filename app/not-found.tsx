import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">404</p>
      <h1 className="mt-2 text-2xl font-bold text-brand-navy">Página no encontrada</h1>
      <p className="mt-3 text-muted">La dirección no existe o fue movida.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-mid"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
