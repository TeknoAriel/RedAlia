import type { PropertyListingSummary } from "@/lib/properties/read-model";
import type { PropertyOperation } from "@/types/property";

export type CatalogSortKey = "recent" | "price_asc" | "price_desc" | "surface_desc";

export type CatalogQueryState = {
  socio: string;
  q: string;
  operation: "" | PropertyOperation;
  typeKey: string;
  sort: CatalogSortKey;
  bedMin: string;
  bathMin: string;
  roomsMin: string;
  parkMin: string;
  city: string;
  addressNeedle: string;
  currency: "" | PropertyListingSummary["currency"];
  priceMin: string;
  priceMax: string;
  m2TotalMin: string;
  m2CoveredMin: string;
  m2TerrainMin: string;
  onlyCredit: boolean;
  onlyBarter: boolean;
  onlyNew: boolean;
  page: number;
};

export type CatalogFilterOptions = {
  typeOptions: { key: string; label: string }[];
  cityOptions: string[];
  currencyOptions: PropertyListingSummary["currency"][];
};

function parsePriceInput(s: string): number | null {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function matchesMin(actual: number | null, minStr: string): boolean {
  if (!minStr) return true;
  const min = Number(minStr);
  if (actual === null) return false;
  return actual >= min;
}

function parseBoolParam(v: string | null): boolean {
  return v === "1" || v === "true" || v === "yes";
}

export function parseCatalogQuery(sp: URLSearchParams): CatalogQueryState {
  const op = (sp.get("operation") ?? "").trim();
  const validOps: PropertyOperation[] = [
    "venta",
    "arriendo",
    "venta_y_arriendo",
    "arriendo_temporal",
    "desconocido",
  ];
  const operation = (validOps.includes(op as PropertyOperation) ? op : "") as "" | PropertyOperation;

  const sortRaw = (sp.get("sort") ?? "recent").trim();
  const sort: CatalogSortKey =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "surface_desc" ? sortRaw : "recent";

  const pageRaw = sp.get("page");
  const pageParsed = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;

  return {
    socio: sp.get("socio")?.trim() ?? "",
    q: sp.get("q")?.trim() ?? "",
    operation,
    typeKey: sp.get("type")?.trim() ?? "",
    sort,
    bedMin: sp.get("bedMin")?.trim() ?? "",
    bathMin: sp.get("bathMin")?.trim() ?? "",
    roomsMin: sp.get("roomsMin")?.trim() ?? "",
    parkMin: sp.get("parkMin")?.trim() ?? "",
    city: sp.get("city")?.trim() ?? "",
    addressNeedle: sp.get("address")?.trim() ?? "",
    currency: (sp.get("currency")?.trim() ?? "") as "" | PropertyListingSummary["currency"],
    priceMin: sp.get("priceMin")?.trim() ?? "",
    priceMax: sp.get("priceMax")?.trim() ?? "",
    m2TotalMin: sp.get("m2TotalMin")?.trim() ?? "",
    m2CoveredMin: sp.get("m2CoveredMin")?.trim() ?? "",
    m2TerrainMin: sp.get("m2TerrainMin")?.trim() ?? "",
    onlyCredit: parseBoolParam(sp.get("onlyCredit")),
    onlyBarter: parseBoolParam(sp.get("onlyBarter")),
    onlyNew: parseBoolParam(sp.get("onlyNew")),
    page,
  };
}

function summaryMatchesPartnerKey(p: PropertyListingSummary, rawKey: string): boolean {
  if (!rawKey.trim()) return true;
  if (p.partnerKeys.includes(rawKey)) return true;
  const kpnetAdv = /^kpnet:advertiser:(\d+)$/.exec(rawKey);
  if (kpnetAdv) {
    return p.partnerKeys.includes(`advertiser:${kpnetAdv[1]}`);
  }
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

export function buildCatalogFilterOptions(properties: PropertyListingSummary[]): CatalogFilterOptions {
  const typeMap = new Map<string, string>();
  for (const p of properties) {
    if (!typeMap.has(p.propertyTypeKey)) typeMap.set(p.propertyTypeKey, p.propertyTypeLabel);
  }
  const typeOptions = [...typeMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([key, label]) => ({ key, label }));

  const cities = new Set<string>();
  for (const p of properties) {
    if (p.city) cities.add(p.city);
  }
  const cityOptions = [...cities].sort((a, b) => a.localeCompare(b, "es"));

  const cur = new Set<PropertyListingSummary["currency"]>();
  for (const p of properties) cur.add(p.currency);
  const order: PropertyListingSummary["currency"][] = ["uf", "clp", "usd", "otro"];
  const currencyOptions = order.filter((c) => cur.has(c));

  return { typeOptions, cityOptions, currencyOptions };
}

export function sortPropertiesCatalog(
  list: PropertyListingSummary[],
  sort: CatalogSortKey,
): PropertyListingSummary[] {
  const out = [...list];
  switch (sort) {
    case "recent":
      return out.sort((a, b) => {
        const am = a.lastUpdateMs ?? 0;
        const bm = b.lastUpdateMs ?? 0;
        return bm - am;
      });
    case "price_asc":
      return out.sort((a, b) => {
        const ap = a.priceNumeric ?? Infinity;
        const bp = b.priceNumeric ?? Infinity;
        return ap - bp;
      });
    case "price_desc":
      return out.sort((a, b) => {
        const ap = a.priceNumeric ?? -Infinity;
        const bp = b.priceNumeric ?? -Infinity;
        return bp - ap;
      });
    case "surface_desc":
      return out.sort((a, b) => {
        const am = a.surfaceM2 ?? -Infinity;
        const bm = b.surfaceM2 ?? -Infinity;
        return bm - am;
      });
    default:
      return out;
  }
}

export function filterPropertiesCatalog(
  properties: PropertyListingSummary[],
  q: CatalogQueryState,
): PropertyListingSummary[] {
  const needle = q.q.trim().toLowerCase();
  const addr = q.addressNeedle.trim().toLowerCase();
  const minN = q.priceMin ? parsePriceInput(q.priceMin) : null;
  const maxN = q.priceMax ? parsePriceInput(q.priceMax) : null;
  const surfMin = q.m2TotalMin ? parseFloat(q.m2TotalMin.replace(",", ".")) : null;
  const covMin = q.m2CoveredMin ? parseFloat(q.m2CoveredMin.replace(",", ".")) : null;
  const terMin = q.m2TerrainMin ? parseFloat(q.m2TerrainMin.replace(",", ".")) : null;

  return properties.filter((p) => {
    if (q.socio && !summaryMatchesPartnerKey(p, q.socio)) return false;
    if (needle && !p.searchBlob.includes(needle) && !p.title.toLowerCase().includes(needle)) {
      return false;
    }
    if (q.operation && p.operation !== q.operation) return false;
    if (q.typeKey && p.propertyTypeKey !== q.typeKey) return false;
    if (q.city && p.city !== q.city) return false;

    if (!matchesMin(p.bedrooms, q.bedMin)) return false;
    if (!matchesMin(p.bathrooms, q.bathMin)) return false;
    if (!matchesMin(p.totalRooms, q.roomsMin)) return false;
    if (!matchesMin(p.parkings, q.parkMin)) return false;

    if (addr) {
      const hay = `${p.address ?? ""} ${p.zone ?? ""} ${p.zoneSecondary ?? ""}`.toLowerCase();
      if (!hay.includes(addr)) return false;
    }

    if (q.currency && p.currency !== q.currency) return false;
    if (q.currency && (minN !== null || maxN !== null)) {
      if (p.priceNumeric === null) return false;
      if (minN !== null && p.priceNumeric < minN) return false;
      if (maxN !== null && p.priceNumeric > maxN) return false;
    }

    if (surfMin !== null && Number.isFinite(surfMin)) {
      if (p.surfaceM2 === null || p.surfaceM2 < surfMin) return false;
    }
    if (covMin !== null && Number.isFinite(covMin)) {
      if (p.coveredM2 === null || p.coveredM2 < covMin) return false;
    }
    if (terMin !== null && Number.isFinite(terMin)) {
      if (p.terrainM2 === null || p.terrainM2 < terMin) return false;
    }

    if (q.onlyCredit && p.fitForCredit !== true) return false;
    if (q.onlyBarter && p.acceptBarter !== true) return false;
    if (q.onlyNew && p.isNewConstruction !== true) return false;

    return true;
  });
}

export function catalogHasActiveFilters(q: CatalogQueryState): boolean {
  return Boolean(
    q.socio ||
      q.q ||
      q.operation ||
      q.typeKey ||
      q.city ||
      q.currency ||
      q.priceMin ||
      q.priceMax ||
      q.bedMin ||
      q.bathMin ||
      q.roomsMin ||
      q.parkMin ||
      q.addressNeedle ||
      q.m2TotalMin ||
      q.m2CoveredMin ||
      q.m2TerrainMin ||
      q.onlyCredit ||
      q.onlyBarter ||
      q.onlyNew,
  );
}

export function catalogPageSize(): number {
  const raw = process.env.REDALIA_PROPERTIES_PAGE_SIZE?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 12 && n <= 60) return n;
  return 30;
}

export function paginateCatalog<T>(
  sorted: T[],
  page: number,
  pageSize: number,
): { slice: T[]; total: number; totalPages: number; safePage: number } {
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    slice: sorted.slice(start, start + pageSize),
    total,
    totalPages,
    safePage,
  };
}

export function serializeCatalogQuery(q: CatalogQueryState, overrides?: Partial<CatalogQueryState>): URLSearchParams {
  const merged = { ...q, ...overrides };
  const sp = new URLSearchParams();
  if (merged.socio) sp.set("socio", merged.socio);
  if (merged.q) sp.set("q", merged.q);
  if (merged.operation) sp.set("operation", merged.operation);
  if (merged.typeKey) sp.set("type", merged.typeKey);
  if (merged.sort && merged.sort !== "recent") sp.set("sort", merged.sort);
  if (merged.bedMin) sp.set("bedMin", merged.bedMin);
  if (merged.bathMin) sp.set("bathMin", merged.bathMin);
  if (merged.roomsMin) sp.set("roomsMin", merged.roomsMin);
  if (merged.parkMin) sp.set("parkMin", merged.parkMin);
  if (merged.city) sp.set("city", merged.city);
  if (merged.addressNeedle) sp.set("address", merged.addressNeedle);
  if (merged.currency) sp.set("currency", merged.currency);
  if (merged.priceMin) sp.set("priceMin", merged.priceMin);
  if (merged.priceMax) sp.set("priceMax", merged.priceMax);
  if (merged.m2TotalMin) sp.set("m2TotalMin", merged.m2TotalMin);
  if (merged.m2CoveredMin) sp.set("m2CoveredMin", merged.m2CoveredMin);
  if (merged.m2TerrainMin) sp.set("m2TerrainMin", merged.m2TerrainMin);
  if (merged.onlyCredit) sp.set("onlyCredit", "1");
  if (merged.onlyBarter) sp.set("onlyBarter", "1");
  if (merged.onlyNew) sp.set("onlyNew", "1");
  if (merged.page > 1) sp.set("page", String(merged.page));
  return sp;
}

export function catalogHref(
  basePath: string,
  current: CatalogQueryState,
  patch: Partial<CatalogQueryState>,
): string {
  const next = { ...current, ...patch };
  const sp = serializeCatalogQuery(next);
  const s = sp.toString();
  return s ? `${basePath}?${s}` : basePath;
}
