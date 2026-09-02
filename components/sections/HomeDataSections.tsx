import "server-only";

import { ListingPulseStrip } from "@/components/sections/ListingPulseStrip";
import { NetworkMcpSignalsSection } from "@/components/sections/NetworkMcpSignalsSection";
import { HomePartnersCarousel } from "@/components/sections/HomePartnersCarousel";
import { PartnerDirectoryPreview } from "@/components/sections/PartnerDirectoryPreview";
import { getProperties } from "@/lib/get-properties";
import { loadPublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp";
import { resolveStablePublicDirectorySnapshot } from "@/lib/public-data/get-stable-partner-directory";

/**
 * Componente server async que agrupa todo lo que depende de la ingesta de catálogo
 * y red AINA. Se monta dentro de un `<Suspense>` en la home para que la cáscara
 * estática (hero, planes, CTA) se entregue de inmediato y este bloque se
 * streamee cuando los datos estén listos.
 */
export async function HomeDataSections() {
  try {
    const [catalog, mcpOverlay] = await Promise.all([
      getProperties(),
      loadPublicMcpNetworkOverlay(),
    ]);

    const stable = catalog.ok
      ? await resolveStablePublicDirectorySnapshot(catalog, { featuredMax: 8 })
      : null;
    const directorySnapshot = stable?.snapshot ?? null;
    const carouselEntries = directorySnapshot?.featured ?? [];
    const listingCount = catalog.ok ? catalog.properties.length : 0;

    return (
      <>
        <ListingPulseStrip listingCount={listingCount} feedOk={catalog.ok} />

        {mcpOverlay ? <NetworkMcpSignalsSection overlay={mcpOverlay} /> : null}

        <HomePartnersCarousel entries={carouselEntries} />

        <PartnerDirectoryPreview
          feedOk={catalog.ok}
          snapshot={directorySnapshot}
          showFeaturedGrid={carouselEntries.length === 0}
        />
      </>
    );
  } catch {
    return <HomeDataSectionsFallback />;
  }
}

/**
 * Skeleton visualmente neutro para reservar layout mientras llegan los datos.
 * Imita la altura aproximada de las secciones streameadas para evitar saltos.
 */
export function HomeDataSectionsFallback() {
  return (
    <>
      <section
        aria-hidden
        className="border-y border-brand-navy/10 bg-brand-navy-soft/30 py-10"
      >
        <div className="mx-auto h-6 max-w-6xl animate-pulse rounded-full bg-brand-navy/10" />
      </section>
      <section aria-hidden className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-1/3 animate-pulse rounded-md bg-brand-navy/10" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 animate-pulse rounded-2xl bg-brand-navy/5" />
          <div className="h-40 animate-pulse rounded-2xl bg-brand-navy/5" />
          <div className="h-40 animate-pulse rounded-2xl bg-brand-navy/5" />
        </div>
      </section>
    </>
  );
}
