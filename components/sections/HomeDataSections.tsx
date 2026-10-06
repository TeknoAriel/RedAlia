import "server-only";

import { ListingPulseStrip } from "@/components/sections/ListingPulseStrip";
import { NetworkMcpSignalsSection } from "@/components/sections/NetworkMcpSignalsSection";
import { HomePartnersCarousel } from "@/components/sections/HomePartnersCarousel";
import { PartnerDirectoryPreview } from "@/components/sections/PartnerDirectoryPreview";
import { loadPublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";

/**
 * Secciones de home que dependen del catálogo / directorio.
 * Lee Redis (mismo fast-path que `/socios`); no dispara ingest en request.
 */
export async function HomeDataSections() {
  try {
    const [{ result, stable }, mcpOverlay] = await Promise.all([
      loadSociosPageData({ featuredMax: 8 }),
      loadPublicMcpNetworkOverlay(),
    ]);

    const directorySnapshot = stable.snapshot ?? null;
    const carouselEntries = directorySnapshot?.featured ?? [];
    const listingCount = result.ok ? result.properties.length : 0;
    const feedOk = result.ok && (listingCount > 0 || Boolean(directorySnapshot?.entries.length));

    return (
      <>
        <ListingPulseStrip listingCount={listingCount} feedOk={feedOk} />

        {mcpOverlay ? <NetworkMcpSignalsSection overlay={mcpOverlay} /> : null}

        <HomePartnersCarousel entries={carouselEntries} />

        <PartnerDirectoryPreview
          feedOk={feedOk}
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
