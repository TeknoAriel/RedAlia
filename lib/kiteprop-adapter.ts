import type {
  NormalizedProperty,
  PropertyAgency,
  PropertyAdvertiser,
  PropertyCurrency,
  PropertyOperation,
} from "@/types/property";
import { labelForPropertyType } from "@/lib/property-labels";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: UnknownRecord, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s.length > 0) return s;
  }
  return null;
}

function pickNumber(obj: UnknownRecord, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n)) continue;
    return n;
  }
  return null;
}

function pickBool(obj: UnknownRecord, keys: string[]): boolean | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
  }
  return null;
}

function normalizeImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.startsWith("http")) {
      out.push(item);
      continue;
    }
    if (isRecord(item)) {
      const u = pickString(item, ["url", "src", "href", "link"]);
      if (u) out.push(u);
    }
  }
  return out;
}

function parseCurrency(raw: string | null): PropertyCurrency {
  if (!raw) return "clp";
  const c = raw.toLowerCase();
  if (c === "uf" || c === "ufm2") return "uf";
  if (c === "clp" || c === "$" || c === "peso") return "clp";
  if (c === "usd" || c === "us$") return "usd";
  return "otro";
}

function formatPriceDisplay(
  value: number | null,
  currency: PropertyCurrency,
  hide: boolean,
): string | null {
  if (hide) return "Consultar";
  if (value === null || value === undefined) return null;
  if (currency === "uf") {
    return `${value.toLocaleString("es-CL", { maximumFractionDigits: 2 })} UF`;
  }
  if (currency === "clp") {
    return `$${Math.round(value).toLocaleString("es-CL")}`;
  }
  if (currency === "usd") {
    return `US$ ${value.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
  }
  return String(value);
}

function inferOperation(obj: UnknownRecord): PropertyOperation {
  const fs = pickBool(obj, ["for_sale", "forSale", "en_venta"]);
  const fr = pickBool(obj, ["for_rent", "forRent", "en_arriendo"]);
  const ft = pickBool(obj, [
    "for_temp_rental",
    "forTempRental",
    "arriendo_temporal",
  ]);
  if (fs && fr) return "venta_y_arriendo";
  if (fs) return "venta";
  if (ft) return "arriendo_temporal";
  if (fr) return "arriendo";
  return "desconocido";
}

function normalizeAgency(raw: unknown): PropertyAgency | null {
  if (!isRecord(raw)) return null;
  const name = pickString(raw, ["name", "nombre", "title", "razon_social"]);
  const id = pickNumber(raw, ["id", "ID", "agency_id"]);
  const logoUrl = pickString(raw, [
    "logo",
    "logo_url",
    "logoUrl",
    "image",
    "avatar",
    "url_logo",
    "brand_image",
    "picture",
  ]);
  if (!name && id === null) return null;
  return {
    id: id !== null ? Math.round(id) : null,
    name: name ?? (id !== null ? `Agencia ${id}` : null),
    logoUrl,
  };
}

/** Socio / anunciante (no confundir con `agency` ni con la lista de agentes asociados). */
function normalizeAdvertiser(raw: UnknownRecord): PropertyAdvertiser | null {
  const nested =
    raw.advertiser ??
    raw.anunciante ??
    raw.socio ??
    raw.publisher ??
    raw.announcer;

  if (typeof nested === "string") {
    const s = nested.trim();
    if (s) return { id: null, name: s, logoUrl: null };
  }
  if (nested && isRecord(nested)) {
    const a = normalizeAgency(nested);
    if (a) return a;
  }

  const name = pickString(raw, [
    "advertiser_name",
    "advertiserName",
    "nombre_anunciante",
    "socio_nombre",
    "nombre_socio",
  ]);
  const logoUrl = pickString(raw, [
    "advertiser_logo",
    "advertiserLogo",
    "logo_anunciante",
    "logo_socio",
  ]);
  const id = pickNumber(raw, ["advertiser_id", "advertiserId", "socio_id", "anunciante_id"]);
  if (!name && id === null) return null;
  return {
    id: id !== null ? Math.round(id) : null,
    name: name ?? (id !== null ? `Socio ${id}` : null),
    logoUrl,
  };
}

function normalizeAssociatedAgentsLabel(raw: UnknownRecord): string | null {
  const candidates = [
    raw.associated_agents,
    raw.associatedAgents,
    raw.agentes_asociados,
    raw.agents,
    raw.agentes,
  ];
  for (const v of candidates) {
    if (!Array.isArray(v) || v.length === 0) continue;
    const names: string[] = [];
    for (const item of v) {
      if (typeof item === "string") {
        const s = item.trim();
        if (s) names.push(s);
        continue;
      }
      if (isRecord(item)) {
        const n =
          pickString(item, [
            "name",
            "nombre",
            "full_name",
            "fullName",
            "title",
            "display_name",
            "displayName",
          ]) ?? null;
        if (n) names.push(n);
      }
    }
    if (names.length) return names.join(" · ");
  }
  return null;
}

function parseLastUpdate(raw: UnknownRecord): { iso: string | null; ms: number | null } {
  const s = pickString(raw, ["last_update", "lastUpdate", "updated_at", "updatedAt"]);
  if (!s) return { iso: null, ms: null };
  const ms = Date.parse(s);
  if (!Number.isFinite(ms)) return { iso: s, ms: null };
  return { iso: s, ms };
}

function summaryFromDescription(desc: string, max = 180): string {
  const oneLine = desc.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max).trim()}…`;
}

/**
 * Convierte un objeto crudo (KiteProp u otro) en el modelo interno.
 * Tolera campos faltantes y nombres alternativos.
 */
export function normalizeKitePropProperty(raw: unknown): NormalizedProperty | null {
  if (!isRecord(raw)) return null;

  const idNum =
    pickNumber(raw, ["id", "ID", "property_id", "codigo", "external_id"]) ?? 0;
  if (!idNum) return null;

  const title =
    pickString(raw, ["title", "titulo", "name", "nombre"]) ?? `Propiedad ${idNum}`;
  const description = pickString(raw, [
    "content",
    "descripcion",
    "description",
    "texto",
    "body",
  ]) ?? "";

  const typeKey =
    pickString(raw, ["property_type", "propertyType", "tipo", "type"]) ?? "others";

  const hidePrices =
    pickBool(raw, ["hide_prices", "hidePrices", "ocultar_precio"]) === true;

  const currency = parseCurrency(
    pickString(raw, ["currency", "moneda", "price_currency"]),
  );

  const operation = inferOperation(raw);

  let priceNumeric: number | null = null;
  if (operation === "venta" || operation === "venta_y_arriendo") {
    priceNumeric = pickNumber(raw, [
      "for_sale_price",
      "forSalePrice",
      "precio",
      "price",
      "venta",
    ]);
  }
  if (
    (operation === "arriendo" ||
      operation === "venta_y_arriendo" ||
      operation === "arriendo_temporal") &&
    priceNumeric === null
  ) {
    priceNumeric = pickNumber(raw, [
      "for_rent_price",
      "forRentPrice",
      "precio_arriendo",
      "canon",
    ]);
  }
  if (operation === "arriendo_temporal") {
    const day = pickNumber(raw, ["for_temp_rental_price_day"]);
    const month = pickNumber(raw, ["for_temp_rental_price_month"]);
    priceNumeric = month ?? day ?? priceNumeric;
  }

  const priceDisplay = formatPriceDisplay(priceNumeric, currency, hidePrices);

  const city = pickString(raw, ["city", "ciudad", "comuna"]);
  const zone = pickString(raw, ["zone", "zona", "barrio"]);
  const zone2 = pickString(raw, ["zone_2", "zone2", "sublocalidad"]);
  const region = pickString(raw, ["region", "estado"]);
  const address = pickString(raw, ["address", "direccion", "calle"]);
  const country = pickString(raw, ["country", "pais"]);

  const bedrooms = pickNumber(raw, ["bedrooms", "dormitorios", "dorms"]);

  const bathrooms = pickNumber(raw, ["bathrooms", "banos", "baños"]);

  const totalRooms =
    pickNumber(raw, ["total_rooms", "totalRooms", "ambientes", "environments"]) ??
    pickNumber(raw, ["rooms", "habitaciones"]);

  const parkings = pickNumber(raw, ["parkings", "parking", "estacionamientos", "cocheras"]);

  const surfaceM2 =
    pickNumber(raw, ["total_meters", "totalMeters", "superficie", "m2_total"]) ??
    pickNumber(raw, ["terrain_size", "terrainSize"]);

  const coveredM2 = pickNumber(raw, ["covered_meters", "coveredMeters", "m2_cubiertos"]);
  const terrainM2 = pickNumber(raw, ["terrain_size", "terrainSize", "terreno_m2"]);

  const images = normalizeImages(
    raw.images ?? raw.fotos ?? raw.gallery ?? raw.photos,
  );

  const sourceUrl = pickString(raw, ["url", "link", "permalink"]);

  const ref = pickString(raw, ["reference", "referencia", "codigo_ref"]) ?? `KP${idNum}`;

  const agency = normalizeAgency(raw.agency ?? raw.corredora ?? raw.inmobiliaria);
  const advertiser = normalizeAdvertiser(raw);
  const associatedAgentsLabel = normalizeAssociatedAgentsLabel(raw);

  const { iso: lastUpdate, ms: lastUpdateMs } = parseLastUpdate(raw);

  const fitForCredit = pickBool(raw, ["fit_for_credit", "fitForCredit", "apto_credito"]);
  const acceptBarter = pickBool(raw, ["accept_barter", "acceptBarter", "acepta_permuta"]);
  const isNewConstruction = pickBool(raw, [
    "is_new_construction",
    "isNewConstruction",
    "nuevo",
  ]);

  const searchBlob = [
    title,
    description,
    city,
    zone,
    zone2,
    region,
    address,
    ref,
    typeKey,
    agency?.name,
    advertiser?.name,
    associatedAgentsLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    id: String(idNum),
    externalNumericId: idNum,
    title,
    summary: summaryFromDescription(description || title),
    description,
    operation,
    propertyTypeKey: typeKey,
    propertyTypeLabel: labelForPropertyType(typeKey),
    priceDisplay,
    priceNumeric,
    currency,
    city,
    zone,
    zoneSecondary: zone2,
    region,
    address,
    country,
    bedrooms: bedrooms !== null ? Math.round(bedrooms) : null,
    bathrooms: bathrooms !== null ? Math.round(bathrooms) : null,
    totalRooms: totalRooms !== null ? Math.round(totalRooms) : null,
    parkings: parkings !== null ? Math.round(parkings) : null,
    surfaceM2,
    coveredM2,
    terrainM2,
    images,
    sourceUrl,
    referenceCode: ref,
    hidePrices,
    advertiser,
    associatedAgentsLabel,
    agency,
    lastUpdate,
    lastUpdateMs,
    fitForCredit,
    acceptBarter,
    isNewConstruction,
    searchBlob,
  };
}

/** Acepta array raíz o envoltorio con distintas claves. */
export function extractRawList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const inner =
    payload.properties ??
    payload.data ??
    payload.items ??
    payload.results ??
    payload.publicaciones;
  if (Array.isArray(inner)) return inner;
  return [];
}

export function normalizePropertyList(payload: unknown): NormalizedProperty[] {
  const list = extractRawList(payload);
  const out: NormalizedProperty[] = [];
  for (const item of list) {
    const n = normalizeKitePropProperty(item);
    if (n) out.push(n);
  }
  return out;
}
