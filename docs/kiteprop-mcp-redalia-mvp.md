# KiteProp MCP — MVP para Redalia web (fase 1)

**Objetivo:** sumar señales agregadas de autoridad y actividad **sin** reemplazar el catálogo JSON, **sin** rearmar el directorio de socios y **sin** exponer PII.

**Credenciales:** el mismo `kp_…` del MCP suele ser **`KITEPROP_API_SECRET`** en Redalia (REST/leads); ver **`docs/kiteprop-credentials.md`**.

**Limitación del workspace:** el servidor MCP `user-kiteprop` no entregó descriptores de tools en disco (`mcps/user-kiteprop` solo metadata + `STATUS.md` con error). La selección de tools se basa en **nombres típicos** que mencionaste y en criterio de riesgo; hay que **validar nombres y payloads reales** cuando el MCP esté operativo.

---

## A. Tools elegidas para alimentar la web pública (vía snapshot)

| Tool (nombre esperado) | Uso en Redalia | Motivo |
|------------------------|----------------|--------|
| **`get_dashboard_stats`** | Agregados tipo “publicaciones activas” / volumen | Alta densidad informativa, bajo detalle identificable si solo números. |
| **`get_property_stats`** | Conteos de actividad / ventanas móviles | Complementa narrativa “red en movimiento”. |

**Contrato en repo:** no consumimos el MCP dentro del request de Next.js. Se espera un **snapshot JSON** (generado por quien tenga MCP: script local, CI, u operador) con forma `PublicMcpSnapshotFileV1` — ver `data/kiteprop-mcp-public-snapshot.example.json`.

---

## B. Tools descartadas para web pública (en esta fase)

| Tool | Motivo |
|------|--------|
| `get_message_stats` | Riesgo de proximidad a conversaciones / leads. |
| `get_property_performance` | Suele acercarse a rendimiento por unidad; más sensible que un agregado. |
| `get_agent_stats` | Desglose por persona / agente → no público sin política fuerte. |
| `get_difusion_report` | Informe suele ser detallado; reservar panel privado. |
| `get_difusion_status` | Puede ser operativo; valorar solo como agregado explícito más adelante. |
| `get_market_analysis` | Comparativas de mercado → riesgo de interpretación y datos sensibles. |

**Revisión:** cuando existan schemas reales del MCP, recategorizar con evidencia (algunas podrían aportar **solo** un entero agregado si el contrato lo garantiza).

---

## C. Qué se implementó

| Pieza | Rol |
|-------|-----|
| `lib/kiteprop-mcp/types.ts` | Tipos snapshot v1 y overlay público. |
| `lib/kiteprop-mcp/map-snapshot-to-public.ts` | Whitelist de claves en `aggregates` → números enteros positivos acotados. |
| `lib/kiteprop-mcp/load-public-overlay.ts` | Carga desde `KITEPROP_MCP_PUBLIC_SNAPSHOT_URL` (revalidate 1 h) o `data/<file>`. |
| `lib/kiteprop-mcp/index.ts` | Barrel. |
| `components/sections/NetworkMcpSignalsSection.tsx` | Bloque “Red en movimiento” en Home **solo si** hay overlay válido. |
| `app/page.tsx` | Llama `loadPublicMcpNetworkOverlay()` y renderiza el bloque opcional. |

**Variables:** `KITEPROP_MCP_PUBLIC_SNAPSHOT_URL` (opcional), `KITEPROP_MCP_PUBLIC_SNAPSHOT_FILE` (opcional, default `kiteprop-mcp-public-snapshot.json` bajo `data/`).

---

## D. Qué se muestra / qué no

### Público (Home)

- Conteos agregados mapeados: `active_listings` (o alias en whitelist), `publications_last_7d` (o alias).
- Texto institucional claro: no sustituye catálogo; sin PII.
- Fecha de `generatedAt` y lista opcional `sourceTools` (solo nombres de herramienta).

### No se muestra

- Payload MCP crudo, emails, teléfonos, nombres de agentes, listados de propiedades desde MCP, embudos, mensajes.

---

## E. Panel privado / fases futuras

- `get_message_stats`, `get_agent_stats`, `get_property_performance`, `get_difusion_report`, `get_market_analysis` → **ruta admin** o herramienta interna con auth, no Home.
- Job que invoque MCP y escriba snapshot **solo** con campos ya acordados.
- Ampliar whitelist si KiteProp documenta claves estables adicionales **solo agregadas**.

---

## F. Flujo recomendado para generar el snapshot (operativo)

1. Con MCP activo, ejecutar las tools elegidas y extraer **solo** números acordados.
2. Armar JSON versión 1 (ver ejemplo en repo).
3. Publicar en URL HTTPS estable **o** desplegar archivo `data/kiteprop-mcp-public-snapshot.json` (gitignored; no commitear datos sensibles).

---

## G. Próximos pasos

1. Reparar / verificar MCP en Cursor y exportar **schemas** reales de `get_dashboard_stats` y `get_property_stats`.
2. Ajustar whitelist de claves en `map-snapshot-to-public.ts` a los nombres reales devueltos.
3. Opcional: acción CI que refresque snapshot en blob/S3 y setee `KITEPROP_MCP_PUBLIC_SNAPSHOT_URL` en Vercel.
