import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerProfileView } from "@/components/public-directory/PartnerProfileView";
import {
  getPartnerDirectorySnapshot,
  getPropertyListingSnapshot,
} from "@/lib/catalog-read-model/read-model-store";
import { findPartnerEntryByPublicSlug } from "@/lib/public-data/find-partner";
import { buildPublicPartnerDetail } from "@/lib/public-data/partner-detail";
import type { PropertyListingSummary } from "@/lib/properties/read-model";

export const revalidate = 86400;

const PREVIEW_LIMIT = 6;

type PageProps = { params: Promise<{ slug: string }> };

function listingMatchesPartnerKey(p: PropertyListingSummary, rawKey: string): boolean {
  if (!rawKey.trim()) return true;
  if (p.partnerKeys.includes(rawKey)) return true;
  const kpnetAdv = /^kpnet:advertiser:(\d+)$/.exec(rawKey);
  if (kpnetAdv) return p.partnerKeys.includes(`advertiser:${kpnetAdv[1]}`);
  const kpnetOrg = /^kpnet:org:(\d+)$/.exec(rawKey);
  if (kpnetOrg) {
    return (
      p.partnerKeys.includes(`agency:${kpnetOrg[1]}`) ||
      p.partnerKeys.includes(`agent:${kpnetOrg[1]}`) ||
      p.partnerKeys.includes(`sub_agent:${kpnetOrg[1]}`)
    );
  }
  return false;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getPartnerDirectorySnapshot();
  const entries = snapshot?.entries ?? [];
  if (entries.length === 0) {
    return { title: "Socio | Redalia" };
  }
  const entry = findPartnerEntryByPublicSlug(entries, slug);
  if (!entry) {
    return { title: "Socio | Redalia" };
  }
  return {
    title: `${entry.displayName} — Socios | Redalia`,
    description: `Ficha institucional de ${entry.displayName} en la red Redalia: presencia en el catálogo y publicaciones asociadas.`,
  };
}

export default async function SocioProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [partnerSnapshot, propertySnapshot] = await Promise.all([
    getPartnerDirectorySnapshot(),
    getPropertyListingSnapshot(),
  ]);
  const entries = partnerSnapshot?.entries ?? [];
  const entry = findPartnerEntryByPublicSlug(entries, slug);
  if (!entry) {
    notFound();
  }
  const detail = buildPublicPartnerDetail(entry);
  const allForPartner = (propertySnapshot?.items ?? []).filter((p) =>
    listingMatchesPartnerKey(p, entry.partnerKey),
  );
  const preview = [...allForPartner]
    .sort((a, b) => (b.lastUpdateMs ?? 0) - (a.lastUpdateMs ?? 0))
    .slice(0, PREVIEW_LIMIT);

  return (
    <PartnerProfileView
      detail={detail}
      propertiesPreview={preview}
      totalPropertyCount={allForPartner.length}
    />
  );
}
