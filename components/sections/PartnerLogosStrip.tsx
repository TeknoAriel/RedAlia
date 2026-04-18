import Image from "next/image";
import { partnerLogos } from "@/lib/site-evidence";

/** Renderiza solo si hay logos verificables en `lib/site-evidence.ts`. */
export function PartnerLogosStrip() {
  if (partnerLogos.length === 0) return null;

  return (
    <section className="border-y border-brand-navy/10 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="redalia-eyebrow redalia-eyebrow--muted text-center">
          Aliados y socios institucionales
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-10 opacity-90 grayscale sm:gap-14">
          {partnerLogos.map((p) => (
            <li key={p.name}>
              <Image src={p.src} alt={p.name} width={140} height={48} className="h-10 w-auto object-contain" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
