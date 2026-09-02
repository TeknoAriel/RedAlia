import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { EvidenceSection } from "@/components/sections/EvidenceSection";
import { PartnerLogosStrip } from "@/components/sections/PartnerLogosStrip";
import { TangibleValueForBrokers } from "@/components/sections/TangibleValueForBrokers";
import { siteConfig } from "@/lib/site-config";
import { getMembersPortalUrl } from "@/lib/public-contact";
import { getVisiblePortalPublishers, portalPublishers } from "@/lib/home-config";
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
import {
  HomeDataSections,
  HomeDataSectionsFallback,
} from "@/components/sections/HomeDataSections";
import { formatMembershipUf, membershipJoinHref, membershipPlans } from "@/lib/membership-plans";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

/**
 * Render dinámico: las secciones que dependen del catálogo + red AINA viven
 * dentro de un `<Suspense>` (ver `HomeDataSections`) y se streamean cuando los
 * datos están listos. La cáscara (hero, valor, tecnología, planes, CTA) se
 * entrega de inmediato — TTFB de la home no debería depender del cold ingest.
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  const visiblePortalPublishers = getVisiblePortalPublishers(portalPublishers);
  const membersPortalUrl = getMembersPortalUrl();

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
            Ver propiedades
          </Link>
          <Link href="/socios" className="btn-redalia-outline-on-navy px-8 py-3.5">
            Ver corredoras
          </Link>
          <a
            href={membersPortalUrl}
            className="btn-redalia-ghost-on-navy px-8 py-3.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            Acceso
            <span className="sr-only"> (abre en nueva pestaña)</span>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-brand-navy/10 bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="redalia-eyebrow redalia-eyebrow--muted">Una red con historia</p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.9rem]">
            La confianza y experiencia de una red inmobiliaria colaborativa, ahora potenciada en Redalia.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Redalia toma lo mejor del trabajo colaborativo entre corredoras y lo proyecta en una plataforma más moderna,
            ordenada y tecnológica, pensada para generar más oportunidades reales de negocio.
          </p>
        </div>
      </section>

      <HomeValuePillars pillars={homeValuePillars} />

      <HomeTechnologyBand points={homeTechnologyPoints} />

      <PortalPublishersStrip portals={visiblePortalPublishers} />

      <Suspense fallback={<HomeDataSectionsFallback />}>
        <HomeDataSections />
      </Suspense>

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

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Suscripciones y precios"
            title="Planes para integrarte a Redalia"
            description="Precios publicados en UF, prueba gratis de 7 días y el mismo stack en todos los niveles: CRM KiteProp, portales, canje y respaldo legal."
            titleVariant="display"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {membershipPlans.map((plan) => (
              <article
                key={plan.key}
                className={`card-elevated rounded-2xl border bg-white p-7 shadow-sm ${
                  plan.featured
                    ? "border-brand-gold/60 ring-1 ring-brand-gold/30"
                    : "border-brand-navy/10 ring-1 ring-brand-navy/[0.04]"
                }`}
              >
                {plan.featured && (
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-gold-deep">
                    Más popular
                  </p>
                )}
                <h3 className="font-display text-xl font-bold text-brand-navy">{plan.name}</h3>
                <p className="mt-2 font-display text-2xl font-bold text-brand-navy">
                  {formatMembershipUf(plan.priceUf)}
                  <span className="ml-1 font-sans text-sm font-medium text-muted">/ mes</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {plan.users === 1 ? "1 usuario" : `${plan.users} usuarios`} · {plan.properties} propiedades.
                </p>
                <Link
                  href={membershipJoinHref(plan)}
                  className="mt-5 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline"
                >
                  Probar 7 días →
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/planes" className="btn-redalia-gold-solid px-8 py-3.5">
              Ver precios
            </Link>
          </div>
        </div>
      </section>

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
          secondaryHref={membersPortalUrl}
          secondaryLabel="Acceso"
          footnote="Respuesta en días hábiles, con tono profesional y sin presión indebida."
        />
      </section>
    </>
  );
}
