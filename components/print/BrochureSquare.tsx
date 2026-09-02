import {
  formatMembershipUf,
  membershipAddons,
  membershipPlans,
} from "@/lib/membership-plans";
import { siteConfig } from "@/lib/site-config";
import {
  redaliaBenefits,
  redaliaFeatures,
  seminarioPromo,
} from "@/lib/campaign-seminario";

function QrImage({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src="/qr-seminario.svg" alt="QR para sumarte a Redalia con 20% de descuento" />
  );
}

export function BrochureSquare() {
  return (
    <div className="brochure-stage">
      <section className="brochure-sheet" aria-label="Exterior: retiración y tapa">
        <div className="brochure-fold" aria-hidden />

        <article className="brochure-panel panel-cream back-cta">
          <p className="section-kicker">Llamado a la acción</p>
          <h2 className="section-title">Sumate ahora</h2>
          <p className="discount">20%</p>
          <p className="discount-sub">de descuento en tu primer trimestre</p>
          <span className="code-pill">Código {seminarioPromo.offerCode}</span>
          <QrImage className="qr" />
          <p className="body-copy" style={{ textAlign: "center", marginTop: "3mm" }}>
            Escanea, registrate y activa el beneficio. Respuesta en días hábiles.
          </p>
          <div className="contact-lines">
            <div>
              <a href={siteConfig.contact.whatsappHref}>{siteConfig.contact.whatsappDisplay}</a>
            </div>
            <div>
              <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
            </div>
            <div>
              <a href="https://www.redalia.cl">www.redalia.cl</a>
            </div>
            <p className="kite-note">Aliado tecnológico KiteProp</p>
          </div>
        </article>

        <article className="brochure-panel panel-navy">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4mm" }}>
            <p className="eyebrow">{seminarioPromo.badge}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-redalia.png"
              alt="Redalia"
              style={{ height: "11mm", width: "auto", background: "#fff", padding: "1mm 1.8mm" }}
            />
          </div>
          <div className="gold-rule" style={{ marginTop: "7mm" }} />
          <h1 className="cover-title">{seminarioPromo.hook}</h1>
          <p className="cover-cta">{seminarioPromo.cta}</p>
          <p className="cover-lead">{seminarioPromo.lead}</p>
          <div className="cover-foot">
            <p className="cover-brand">REDALIA</p>
            <p className="cover-lockup">{siteConfig.brandLockup}</p>
          </div>
        </article>
      </section>

      <section className="brochure-sheet" aria-label="Interior: características, beneficios y planes">
        <div className="brochure-fold" aria-hidden />

        <article className="brochure-panel panel-white">
          <p className="section-kicker">La red</p>
          <h2 className="section-title">Características de Redalia</h2>
          <p className="body-copy">
            Comunidad profesional de corredoras e inmobiliarias en Chile: canje con reglas, tecnología y respaldo para
            cerrar más y mejor.
          </p>
          <ul className="feature-list">
            {redaliaFeatures.map((item) => (
              <li key={item}>
                <span className="mark">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="stats-row">
            <div className="stat">
              <strong>+3.000</strong>
              <em>Propiedades</em>
            </div>
            <div className="stat">
              <strong>+600</strong>
              <em>Oficinas en red</em>
            </div>
          </div>
        </article>

        <article className="brochure-panel panel-cream">
          <p className="section-kicker">Por qué sumarte</p>
          <h2 className="section-title">Beneficios para tu oficina</h2>
          <div className="benefit-grid">
            {redaliaBenefits.map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>

          <p className="section-kicker" style={{ marginTop: "5mm" }}>
            Membresía
          </p>
          <h2 className="section-title">Planes de referencia</h2>
          <table className="plans-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>UF / mes</th>
                <th>Cupo</th>
              </tr>
            </thead>
            <tbody>
              {membershipPlans.map((plan) => (
                <tr key={plan.key} className={plan.featured ? "featured" : undefined}>
                  <td className="plan-name">
                    {plan.name.replace("Plan ", "")}
                    {plan.featured ? " · popular" : ""}
                  </td>
                  <td>{formatMembershipUf(plan.priceUf)}</td>
                  <td>
                    {plan.users} u · {plan.properties} prop.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="plans-note">
            Referencia en UF. Add-ons: {membershipAddons.map((a) => `${a.label} ${formatMembershipUf(a.priceUf)}`).join(", ")}.
            Equipos mayores: plan a medida.
          </p>
        </article>
      </section>
    </div>
  );
}
