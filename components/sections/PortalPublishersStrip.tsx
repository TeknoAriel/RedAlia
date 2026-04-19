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
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {portals.map((p) => {
            const inner = (
              <>
                {p.logoSrc ? (
                  <Image
                    src={p.logoSrc}
                    alt={p.name}
                    width={160}
                    height={52}
                    className="h-11 w-auto max-w-[9.5rem] object-contain opacity-90 grayscale transition hover:opacity-100 hover:grayscale-0"
                  />
                ) : (
                  <span className="inline-flex min-h-[2.75rem] min-w-[7rem] items-center justify-center rounded-xl border border-brand-navy/15 bg-brand-navy-soft/60 px-4 text-center text-xs font-semibold text-brand-navy">
                    {p.name}
                  </span>
                )}
              </>
            );
            return (
              <li key={p.name}>
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
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
