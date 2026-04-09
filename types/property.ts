/**
 * Modelo interno normalizado para propiedades (independiente del JSON crudo de KiteProp).
 */
export type PropertyOperation =
  | "venta"
  | "arriendo"
  | "venta_y_arriendo"
  | "arriendo_temporal"
  | "desconocido";

export type PropertyCurrency = "uf" | "clp" | "usd" | "otro";

/** Agencia u oficina según objeto `agency` del feed KiteProp */
export interface PropertyAgency {
  id: number | null;
  name: string | null;
  logoUrl: string | null;
}

/**
 * Socio / anunciante que publica (distinto de la agencia y de los agentes asociados en muchos JSON).
 */
export type PropertyAdvertiser = PropertyAgency;

export interface NormalizedProperty {
  id: string;
  externalNumericId: number;
  title: string;
  summary: string;
  description: string;
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
  country: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Ambientes / piezas (total_rooms) */
  totalRooms: number | null;
  parkings: number | null;
  surfaceM2: number | null;
  coveredM2: number | null;
  terrainM2: number | null;
  images: string[];
  sourceUrl: string | null;
  referenceCode: string;
  hidePrices: boolean;
  /** Quién publica / socio anunciante (`advertiser`, `anunciante`, `socio`, etc.) */
  advertiser: PropertyAdvertiser | null;
  /** Texto armado desde `associated_agents` / `agentes_asociados` si viene en el JSON */
  associatedAgentsLabel: string | null;
  agency: PropertyAgency | null;
  /** ISO string desde last_update del feed */
  lastUpdate: string | null;
  lastUpdateMs: number | null;
  fitForCredit: boolean | null;
  acceptBarter: boolean | null;
  isNewConstruction: boolean | null;
  /** Texto plano para búsqueda en cliente/servidor */
  searchBlob: string;
}
