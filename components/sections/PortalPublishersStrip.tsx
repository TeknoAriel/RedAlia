import Image from "next/image";
import Link from "next/link";
import type { PortalPublisherEntry } from "@/lib/home-config";

type Props = {
  portals: readonly PortalPublisherEntry[];
};

/**
 * Franja de portales donde publica la red. Si `portals` está vacío, no renderiza.
 */
export function PortalPublishersStrip({ portals }: Props) {
  if (!portals.length) return null;

  return (
    <section className="border-b border-brand-navy/10 bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="redalia-eyebrow redalia-eyebrow--muted text-center">Portales donde publicamos</p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-muted">
          La difusión cruzada apoya la visibilidad; el valor central sigue siendo el negocio compartido y la colaboración
          entre socios en Chile.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((p) => {
            const inner = (
              <div className="flex min-h-[5.5rem] items-center justify-center rounded-xl border border-brand-navy/10 bg-brand-navy-soft/20 px-3">
                {p.logoSrc ? (
                  <Image
                    src={p.logoSrc}
                    alt={p.name}
                    width={160}
                    height={52}
                    className="h-10 w-auto max-w-[9rem] object-contain opacity-90 grayscale transition hover:opacity-100 hover:grayscale-0"
                  />
                ) : (
                  <span className="text-center text-xs font-semibold text-brand-navy">{p.name}</span>
                )}
              </div>
            );
            return (
              <li key={p.name} className="rounded-2xl border border-brand-navy/10 bg-white p-3 text-center shadow-sm">
                {p.href ? (
                  <Link
                    href={p.href}
                    className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
                <p className="mt-2 text-xs font-semibold text-brand-navy">{p.name}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
