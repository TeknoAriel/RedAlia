"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

type Props = {
  entries: PublicPartnerDirectoryEntry[];
  /** Cuántas cards se muestran al cargar (SSR + primer paint). */
  initialCount: number;
  /** Incremento al llegar al final del scroll. */
  pageSize: number;
};

/**
 * Grilla del directorio con carga progresiva al scrollear (IntersectionObserver).
 * Todas las filas ya vienen del servidor; no hay paginación por URL ni requests extra.
 */
export function SociosInfiniteGrid({ entries, initialCount, pageSize }: Props) {
  const safeInitial = Math.min(Math.max(initialCount, 1), entries.length || 1);
  const step = Math.max(pageSize, 1);
  const [visibleCount, setVisibleCount] = useState(safeInitial);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = visibleCount < entries.length;
  const visible = entries.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + step, entries.length));
  }, [entries.length, step]);

  useEffect(() => {
    setVisibleCount(safeInitial);
  }, [safeInitial, entries.length]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (records) => {
        if (records.some((r) => r.isIntersecting)) loadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  if (entries.length === 0) return null;

  return (
    <div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((entry) => (
          <li key={entry.partnerKey}>
            <PartnerDirectoryCard entry={entry} variant="default" />
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-brand-navy/10 pt-6">
        <p className="text-sm text-muted" aria-live="polite">
          Mostrando{" "}
          <span className="font-semibold text-brand-navy">{visible.length}</span> de{" "}
          <span className="font-semibold text-brand-navy">{entries.length}</span> socios
        </p>
        {hasMore ? (
          <>
            <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
            >
              Ver más socios
            </button>
          </>
        ) : (
          <p className="text-xs text-muted">Fin del directorio</p>
        )}
      </div>
    </div>
  );
}
