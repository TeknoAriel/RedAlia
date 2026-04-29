import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { access } from "node:fs/promises";
import path from "node:path";
import { VideoPreviewModalCard } from "@/components/sections/VideoPreviewModalCard";

const institucionalVideoPath = "/videos/kiteprop-institucional.mp4";
const caracteristicasVideoPath = "/videos/kiteprop-caracteristicas.mp4";
const legacyCaracteristicasVideoPath = "/videos/WhatsApp Video 2026-04-28 at 12.06.18.mp4";

async function hasPublicVideo(relativePath: string): Promise<boolean> {
  try {
    await access(path.join(process.cwd(), "public", relativePath.replace(/^\//, "")));
    return true;
  } catch {
    return false;
  }
}

export async function KitePropTechnologySection() {
  const [hasInstitucional, hasCaracteristicas, hasLegacyCaracteristicas] = await Promise.all([
    hasPublicVideo(institucionalVideoPath),
    hasPublicVideo(caracteristicasVideoPath),
    hasPublicVideo(legacyCaracteristicasVideoPath),
  ]);

  const institucionalSrc = hasInstitucional ? institucionalVideoPath : null;
  const caracteristicasSrc = hasCaracteristicas
    ? caracteristicasVideoPath
    : hasLegacyCaracteristicas
      ? legacyCaracteristicasVideoPath
      : null;

  return (
    <section className="border-b border-brand-navy/10 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionLogoMark size="sm" className="mb-5" />
        <p className="redalia-eyebrow redalia-eyebrow--muted">Ecosistema tecnológico</p>
        <h2 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-3xl">
          La red opera con KiteProp, uno de los CRM más avanzados de Latinoamérica
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          RedAlia trabaja sobre KiteProp para integrar publicación, seguimiento comercial y asistencia con IA en un
          flujo único. Esto permite una operación más ordenada, con mejor trazabilidad y foco en oportunidades reales.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          <li className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/35 p-5">
            <h3 className="text-sm font-semibold text-brand-navy">CRM premiado</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Plataforma consolidada para operación inmobiliaria con estándares profesionales.
            </p>
          </li>
          <li className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/35 p-5">
            <h3 className="text-sm font-semibold text-brand-navy">Integración de IA</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Asistencia para priorización y seguimiento comercial orientado a cierre.
            </p>
          </li>
          <li className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/35 p-5">
            <h3 className="text-sm font-semibold text-brand-navy">Operación en red</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Publicación y colaboración entre socios bajo el mismo marco tecnológico.
            </p>
          </li>
        </ul>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          <VideoPreviewModalCard title="Video institucional KiteProp" src={institucionalSrc} />
          <VideoPreviewModalCard title="Características de KiteProp" src={caracteristicasSrc} />
        </div>
      </div>
    </section>
  );
}
