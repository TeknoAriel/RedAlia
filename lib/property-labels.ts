/** Etiquetas en español para tipos típicos de KiteProp (property_type). */
const TYPE_MAP: Record<string, string> = {
  houses: "Casa",
  apartments: "Departamento",
  residential_lands: "Terreno / lote",
  offices: "Oficina",
  commercial: "Local comercial",
  warehouses: "Bodega",
  farms: "Campo / chacra",
  parking: "Estacionamiento",
  retail: "Retail",
  buildings: "Edificio",
  others: "Otro",
};

export function labelForPropertyType(key: string | null | undefined): string {
  if (!key) return "Propiedad";
  const k = String(key).toLowerCase().trim();
  return TYPE_MAP[k] ?? key.replace(/_/g, " ");
}
