import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerProfileView } from "@/components/public-directory/PartnerProfileView";
import { getProperties } from "@/lib/get-properties";
import { findPartnerEntryByPublicSlug } from "@/lib/public-data/find-partner";
import { resolveStablePublicDirectorySnapshot } from "@/lib/public-data/get-stable-partner-directory";
import { buildPublicPartnerDetail } from "@/lib/public-data/partner-detail";
import {
  filterPropertiesForPartnerKey,
  selectPartnerPropertiesPreview,
} from "@/lib/public-data/partner-properties";

export const revalidate = 1800;

const PREVIEW_LIMIT = 6;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProperties();
  if (!result.ok) {
    return { title: "Socio | Redalia" };
  }
  const stable = await resolveStablePublicDirectorySnapshot(result, { featuredMax: 8 });
  const entries = stable.snapshot?.entries ?? [];
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
  const result = await getProperties();
  if (!result.ok) {
    notFound();
  }
  const stable = await resolveStablePublicDirectorySnapshot(result, { featuredMax: 8 });
  const entries = stable.snapshot?.entries ?? [];
  const entry = findPartnerEntryByPublicSlug(entries, slug);
  if (!entry) {
    notFound();
  }
  const detail = buildPublicPartnerDetail(entry);
  const allForPartner = filterPropertiesForPartnerKey(result.properties, entry.partnerKey);
  const preview = selectPartnerPropertiesPreview(result.properties, entry.partnerKey, PREVIEW_LIMIT);

  return (
    <PartnerProfileView
      detail={detail}
      propertiesPreview={preview}
      totalPropertyCount={allForPartner.length}
    />
  );
}
