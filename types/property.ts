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

/** Agencia / socio según objeto `agency` del feed KiteProp */
export interface PropertyAgency {
  id: number | null;
  name: string | null;
  logoUrl: string | null;
}

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
