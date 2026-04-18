/**
 * Modelo público para señales agregadas originadas en herramientas MCP KiteProp
 * (vía snapshot generado fuera del request o pipeline interno).
 * No incluye PII ni payload crudo.
 */

export type PublicMcpNetworkOverlay = {
  /** ISO 8601 — cuándo se generó el snapshot en origen. */
  generatedAt: string;
  /** Herramientas MCP declaradas como fuente (solo metadato, no secreto). */
  sourceTools: string[];
  /** Publicaciones activas u homólogo agregado (whitelist). */
  activeListingsHint: number | null;
  /** Conteo agregado de actividad reciente (p. ej. ventana 7d), si viene en snapshot. */
  recentPublicationsWindowHint: number | null;
};

export type PublicMcpSnapshotFileV1 = {
  version: 1;
  generatedAt: string;
  /** Nombres de tools MCP usadas al generar este archivo (auditoría). */
  sourceTools?: string[];
  aggregates?: Record<string, unknown>;
};
