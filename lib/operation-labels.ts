import type { PropertyOperation } from "@/types/property";

const MAP: Record<PropertyOperation, string> = {
  venta: "Venta",
  arriendo: "Arriendo",
  venta_y_arriendo: "Venta y arriendo",
  arriendo_temporal: "Arriendo temporal",
  desconocido: "Operación",
};

export function labelForOperation(op: PropertyOperation): string {
  return MAP[op] ?? "Operación";
}
