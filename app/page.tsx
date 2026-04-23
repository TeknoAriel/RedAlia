import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { EvidenceSection } from "@/components/sections/EvidenceSection";
import { ListingPulseStrip } from "@/components/sections/ListingPulseStrip";
import { PartnerLogosStrip } from "@/components/sections/PartnerLogosStrip";
import { TangibleValueForBrokers } from "@/components/sections/TangibleValueForBrokers";
import { PartnerDirectoryPreview } from "@/components/sections/PartnerDirectoryPreview";
import { getProperties, getPartnerDirectoryExtraDrafts } from "@/lib/get-properties";
import { loadPublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";
import { NetworkMcpSignalsSection } from "@/components/sections/NetworkMcpSignalsSection";
import { siteConfig } from "@/lib/site-config";
import { portalPublishers } from "@/lib/home-config";
import {
  homeHeroFootnote,
  homeHeroLead,
  homeHeroLeadSecondary,
  homeHeroTitle,
  homeTechnologyPoints,
  homeTrainingCollaboration,
  homeValuePillars,
} from "@/lib/home-marketing";
import { HomeValuePillars } from "@/components/sections/HomeValuePillars";
import { HomeTechnologyBand } from "@/components/sections/HomeTechnologyBand";
import { PortalPublishersStrip } from "@/components/sections/PortalPublishersStrip";
import { HomePartnersCarousel } from "@/components/sections/HomePartnersCarousel";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

export default async function HomePage() {
  const catalog = await getProperties();
  const listingCount = catalog.ok ? catalog.properties.length : 0;
  const directorySnapshot =
    catalog.ok
      ? buildPublicDirectorySnapshot(catalog.properties, {
          featuredMax: 8,
          extraDirectoryDrafts: getPartnerDirectoryExtraDrafts(catalog),
        })
      : null;
  const mcpOverlay = await loadPublicMcpNetworkOverlay();
  const carouselEntries = directorySnapshot?.featured ?? [];

  return (
    <>
      <PageHero
        variant="navy-image"
        imageSrc={heroImage}
        imageAlt=""
        prepend={
          <>
            <SectionLogoMark size="lg" align="start" className="mb-4" />
            <p className="redalia-eyebrow redalia-eyebrow--onNavy redalia-eyebrow--compact max-w-xl">
              {siteConfig.brandLockup}
            </p>
            <p className="redalia-hero-tagline mt-2">{siteConfig.tagline}</p>
          </>
        }
        title={homeHeroTitle}
        lead={homeHeroLead}
        leadSecondary={homeHeroLeadSecondary}
        footnote={homeHeroFootnote}
        contentClassName="py-20 sm:py-24 lg:py-28"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link href="/propiedades" className="btn-redalia-gold-solid px-8 py-3.5">
            Ver catálogo
          </Link>
          <Link href="/unete" className="btn-redalia-outline-on-navy px-8 py-3.5">
            Postular como socio
          </Link>
        </div>
      </PageHero>

      <HomeValuePillars pillars={homeValuePillars} />

      <HomeTechnologyBand points={homeTechnologyPoints} />

      <ListingPulseStrip listingCount={listingCount} feedOk={catalog.ok} />

      <PortalPublishersStrip portals={portalPublishers} />

      {mcpOverlay ? <NetworkMcpSignalsSection overlay={mcpOverlay} /> : null}

      <HomePartnersCarousel entries={carouselEntries} />

      <PartnerDirectoryPreview
        feedOk={catalog.ok}
        snapshot={directorySnapshot}
        showFeaturedGrid={carouselEntries.length === 0}
      />

      <TangibleValueForBrokers />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <EvidenceSection />
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            eyebrow={homeTrainingCollaboration.eyebrow}
            title={homeTrainingCollaboration.title}
            description={homeTrainingCollaboration.body}
            titleVariant="display"
          />
          <ul className="mt-8 flex flex-wrap gap-4">
            {homeTrainingCollaboration.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex rounded-full border border-brand-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-brand-gold/40"
                >
                  {l.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 sm:py-16">
        <SectionLogoMark size="sm" className="mb-5" />
        <SectionHeader
          align="center"
          eyebrow="Recorridos según rol"
          title="Corredoras y agentes en la misma comunidad"
          description="Un marco de pertenencia común, con recorridos distintos según escala, marca y forma de captar negocios reales en Chile."
          titleVariant="display"
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm ring-1 ring-brand-navy/[0.04]">
            <h3 className="font-display text-xl font-bold text-brand-navy">Para corredoras</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Coordinación entre equipos, canales para tu oferta y canje con reglas claras, sin perder tu independencia
              frente al mercado ni el 100% de tus honorarios.
            </p>
            <Link href="/planes" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
              Ver membresía →
            </Link>
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm ring-1 ring-brand-navy/[0.04]">
            <h3 className="font-display text-xl font-bold text-brand-navy">Para agentes inmobiliarios</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Más oportunidades para ofrecer, colegas con foco en cierre y respaldo institucional para ordenar tu
              pipeline comercial, siempre con tu marca al frente.
            </p>
            <Link href="/unete" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
              Postular como socio →
            </Link>
          </div>
        </div>
      </section>

      <PartnerLogosStrip />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 sm:py-16">
        <p className="redalia-eyebrow redalia-eyebrow--muted mx-auto !mb-0 max-w-xl text-center">
          Pertenencia a la comunidad
        </p>
        <SectionLogoMark size="sm" className="mb-6 mt-3" />
        <CTASection
          title="¿Tu corredora quiere sumarse a Redalia?"
          description="Coordinamos una conversación sin compromiso: criterios de colaboración, membresía con acompañamiento y claridad sobre honorarios y relación con el cliente."
          primaryHref="/propiedades"
          primaryLabel="Ver catálogo"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          footnote="Respuesta en días hábiles, con tono profesional y sin presión indebida."
        />
      </section>
    </>
  );
}
