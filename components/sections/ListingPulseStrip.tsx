type Props = {
  /** Conteo real desde el catálogo servido en esta petición (puede ser muestra o feed remoto). */
  listingCount: number;
  feedOk: boolean;
};

/**
 * Franja breve con señal de actividad del catálogo. El número refleja lo cargado en backend, no una métrica de marketing inventada.
 */
export function ListingPulseStrip({ listingCount, feedOk }: Props) {
  if (!feedOk) {
    return (
      <div className="strip-navy border-y border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-5 text-center sm:flex-row sm:gap-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-white/90">Catálogo: coordinamos contigo el acceso a publicaciones y socios.</p>
        </div>
      </div>
    );
  }

  if (listingCount <= 0) {
    return (
      <div className="strip-navy border-y border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-5 text-center sm:flex-row sm:gap-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-white/90">
            Oportunidades de la red: el listado se actualiza según la operación de socios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="strip-navy border-y border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col flex-wrap items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-center text-sm text-white/85 sm:text-left">
          <span className="font-semibold text-brand-gold">{listingCount.toLocaleString("es-CL")}</span>
          <span className="text-white/80">
            {" "}
            {listingCount === 1 ? "oportunidad publicada" : "oportunidades publicadas"} en el catálogo en línea de la
            red.
          </span>
        </p>
        <p className="text-center text-xs text-white/60 sm:text-right">
          Número referido al listado servido en este momento; convive con la colaboración y el canje entre socios.
        </p>
      </div>
    </div>
  );
}
