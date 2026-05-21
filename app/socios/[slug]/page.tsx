import type { Metadata } from "next";
import { PartnerProfileView } from "@/components/public-directory/PartnerProfileView";
import { loadPartnerProfilePage } from "@/lib/public-data/load-partner-profile-page";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";
import { findPartnerEntryByPublicSlug } from "@/lib/public-data/find-partner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PREVIEW_LIMIT = 6;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { stable } = await loadSociosPageData({ featuredMax: 8 });
  const entry = findPartnerEntryByPublicSlug(stable.snapshot?.entries ?? [], slug);
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
  const { detail, preview, totalPropertyCount } = await loadPartnerProfilePage(slug, {
    previewLimit: PREVIEW_LIMIT,
  });

  return (
    <PartnerProfileView
      detail={detail}
      propertiesPreview={preview}
      totalPropertyCount={totalPropertyCount}
    />
  );
}
