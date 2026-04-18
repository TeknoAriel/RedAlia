import type { PublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp/types";

type Props = {
  overlay: PublicMcpNetworkOverlay;
};

/**
 * Bloque institucional opcional: solo aparece si hay snapshot MCP mapeado con agregados positivos.
 * No muestra payload crudo ni datos por agente.
 */
export function NetworkMcpSignalsSection({ overlay }: Props) {
  const date = new Date(overlay.generatedAt);
  const dateStr = Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("es-CL", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "America/Santiago",
      });

  return (
    <section className="border-b border-brand-navy/10 bg-brand-navy-soft/35 py-6 sm:py-7">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-navy/50">Red en movimiento</p>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-brand-navy/90 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-2">
          {overlay.activeListingsHint != null && (
            <p>
              <span className="font-semibold text-brand-navy tabular-nums">
                {overlay.activeListingsHint.toLocaleString("es-CL")}
              </span>{" "}
              publicaciones activas en el circuito operativo asociado a la red.
            </p>
          )}
          {overlay.recentPublicationsWindowHint != null && (
            <p>
              <span className="font-semibold text-brand-navy tabular-nums">
                {overlay.recentPublicationsWindowHint.toLocaleString("es-CL")}
              </span>{" "}
              movimientos recientes en ventana agregada (difusión / actividad).
            </p>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-muted">
          Cifras agregadas verificadas en origen ({dateStr}). Complementan el catálogo público; no lo reemplazan ni
          incluyen datos personales.
          {overlay.sourceTools.length > 0 ? (
            <span className="block pt-1 font-mono text-[10px] text-brand-navy/40">
              Fuente declarada: {overlay.sourceTools.join(", ")}
            </span>
          ) : null}
        </p>
      </div>
    </section>
  );
}
