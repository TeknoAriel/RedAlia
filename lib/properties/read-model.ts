import "server-only";

import { distinctScopedPartnersOnProperty } from "@/lib/agencies";
import type { NormalizedProperty, PropertyCurrency, PropertyOperation } from "@/types/property";

export type PropertyListingSummary = {
  id: string;
  slug: string;
  title: string;
  operation: PropertyOperation;
  propertyTypeKey: string;
  propertyTypeLabel: string;
  priceDisplay: string | null;
  priceNumeric: number | null;
  currency: PropertyCurrency;
  city: string | null;
  zone: string | null;
  zoneSecondary: string | null;
  region: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  totalRooms: number | null;
  parkings: number | null;
  surfaceM2: number | null;
  coveredM2: number | null;
  terrainM2: number | null;
  mainImageUrl: string | null;
  partnerName: string | null;
  partnerKey: string | null;
  referenceCode: string;
  fitForCredit: boolean | null;
  acceptBarter: boolean | null;
  isNewConstruction: boolean | null;
  searchBlob: string;
  lastUpdateMs: number | null;
  partnerKeys: string[];
};

export type PropertyListingSnapshot = {
  generatedAtMs: number;
  totalItems: number;
  items: PropertyListingSummary[];
};

function slugFromProperty(p: NormalizedProperty): string {
  return p.id;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

export function toPropertyListingSummary(p: NormalizedProperty): PropertyListingSummary {
  const partnerKeys = dedupe(distinctScopedPartnersOnProperty(p).map((x) => x.key));
  if (p.advertiser?.id != null) {
    partnerKeys.push(`kpnet:advertiser:${p.advertiser.id}`);
  }
  if (p.agency?.id != null) partnerKeys.push(`kpnet:org:${p.agency.id}`);
  if (p.agentAgency?.id != null) partnerKeys.push(`kpnet:org:${p.agentAgency.id}`);
  if (p.subAgentAgency?.id != null) partnerKeys.push(`kpnet:org:${p.subAgentAgency.id}`);

  const primaryPartner =
    p.advertiser?.name?.trim() ||
    p.agency?.name?.trim() ||
    p.agentAgency?.name?.trim() ||
    p.subAgentAgency?.name?.trim() ||
    null;

  return {
    id: p.id,
    slug: slugFromProperty(p),
    title: p.title,
    operation: p.operation,
    propertyTypeKey: p.propertyTypeKey,
    propertyTypeLabel: p.propertyTypeLabel,
    priceDisplay: p.priceDisplay,
    priceNumeric: p.priceNumeric,
    currency: p.currency,
    city: p.city,
    zone: p.zone,
    zoneSecondary: p.zoneSecondary,
    region: p.region,
    address: p.address,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    totalRooms: p.totalRooms,
    parkings: p.parkings,
    surfaceM2: p.surfaceM2,
    coveredM2: p.coveredM2,
    terrainM2: p.terrainM2,
    mainImageUrl: p.images[0] ?? null,
    partnerName: primaryPartner,
    partnerKey: partnerKeys[0] ?? null,
    referenceCode: p.referenceCode,
    fitForCredit: p.fitForCredit,
    acceptBarter: p.acceptBarter,
    isNewConstruction: p.isNewConstruction,
    searchBlob: p.searchBlob,
    lastUpdateMs: p.lastUpdateMs,
    partnerKeys: dedupe(partnerKeys),
  };
}

export function buildPropertyListingSnapshot(properties: NormalizedProperty[]): PropertyListingSnapshot {
  const items = properties.map(toPropertyListingSummary);
  return {
    generatedAtMs: Date.now(),
    totalItems: items.length,
    items,
  };
}
