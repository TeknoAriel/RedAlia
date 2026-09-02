import {
  formatMembershipUf,
  membershipAddons,
  membershipIncludedFeatures,
  membershipPlans,
} from "@/lib/membership-plans";
import { siteConfig } from "@/lib/site-config";
import { seminarioPromo } from "@/lib/campaign-seminario";

function QrBlock({ size, caption }: { size: "cover" | "back"; caption: string }) {
  const cls = size === "back" ? undefined : "qr-box";
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/qr-seminario.svg" alt="Código QR a redalia.cl/seminario" />
  );
  if (size === "back") return img;
  return (
    <div className={cls}>
      {img}
      <p className="qr-caption">{caption}</p>
    </div>
  );
}

export function BrochureSquare() {
  return (
    <div className="brochure-stage">
      {/* Exterior: dorso | portada — al plegar, la portada queda al frente */}
      <section className="brochure-sheet" aria-label="Exterior del folleto: dorso y portada">
        <div className="brochure-fold" aria-hidden />
        <article className="brochure-panel panel-cream">
          <div className="back-qr">
            <p className="section-kicker">{seminarioPromo.badge}</p>
            <QrBlock size="back" caption="" />
            <h2>Activa tu prueba de 7 días</h2>
            <p>
              Escanea y entra a redalia.cl/seminario. Coordinamos mesa de incorporación preferente para oficinas y
              equipos comerciales.
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
            </div>
            <p className="kite-note">Aliado tecnológico KiteProp</p>
          </div>
        </article>

        <article className="brochure-panel panel-navy">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8mm" }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              {seminarioPromo.badge}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-redalia.png"
              alt="Redalia"
              style={{ height: "14mm", width: "auto", background: "#fff", padding: "1.5mm 2.5mm" }}
            />
          </div>
          <div className="gold-rule" style={{ marginTop: "8mm" }} />
          <h1 className="cover-title">
            Tu operación ya es grande.
            <br />
            Tu red debería serlo también.
          </h1>
          <p className="cover-lead">{seminarioPromo.lead}</p>
          <div className="cover-foot">
            <div>
              <p className="cover-brand">{siteConfig.name.toUpperCase()}</p>
              <p className="cover-lockup">{siteConfig.brandLockup}</p>
            </div>
            <QrBlock size="cover" caption="Prueba 7 días" />
          </div>
        </article>
      </section>

      {/* Interior: perfil | planes */}
      <section className="brochure-sheet" aria-label="Interior del folleto: perfil y planes">
        <div className="brochure-fold" aria-hidden />
        <article className="brochure-panel panel-white">
          <p className="section-kicker">Perfil comercial</p>
          <h2 className="section-title">Una red institucional para oficinas que ya operan en serio</h2>
          <p className="body-copy">
            Redalia no es un grupo informal de colegas. Es una red de alianzas para corredoras, estudios e inmobiliarias
            en Chile: canje con reglas, catálogo compartido, tecnología KiteProp y respaldo legal —con tu marca al
            frente y el 100% de tus honorarios.
          </p>
          <ul className="profile-list">
            <li>
              <span className="mark">▸</span>
              Gerencias comerciales que necesitan más stock calificado sin abrir otra marca.
            </li>
            <li>
              <span className="mark">▸</span>
              Oficinas con varios ejecutivos que quieren más terreno y menos dependencia de un solo canal.
            </li>
            <li>
              <span className="mark">▸</span>
              Inmobiliarias con cartera propia que buscan difusión en portales y canje entre pares.
            </li>
          </ul>
          <ul className="profile-list">
            {membershipIncludedFeatures.map((item) => (
              <li key={item}>
                <span className="mark">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="stats-row">
            <div className="stat">
              <strong>+3.000</strong>
              <em>Propiedades en catálogo</em>
            </div>
            <div className="stat">
              <strong>+600</strong>
              <em>Corredoras y anunciantes</em>
            </div>
          </div>
        </article>

        <article className="brochure-panel panel-cream">
          <p className="section-kicker">Membresía</p>
          <h2 className="section-title">Planes publicados en UF</h2>
          <p className="body-copy" style={{ marginTop: "3mm" }}>
            Misma base en todos los niveles. Cambia el cupo de usuarios y propiedades. Equipos y redes mayores:
            conversamos un plan a medida.
          </p>
          <div className="plans-grid">
            {membershipPlans.map((plan) => (
              <div key={plan.key} className={`plan-card${plan.featured ? " featured" : ""}`}>
                {plan.featured ? <p className="badge">Más popular</p> : null}
                <p className="name">{plan.name}</p>
                <p className="price">{formatMembershipUf(plan.priceUf)}</p>
                <p className="meta">
                  {plan.users === 1 ? "1 usuario" : `${plan.users} usuarios`} · {plan.properties} propiedades
                </p>
              </div>
            ))}
          </div>
          <p className="addons">
            Add-ons: {membershipAddons.map((a) => `${a.label} ${formatMembershipUf(a.priceUf)}`).join(" · ")} al mes.
          </p>
          <p className="included">{membershipIncludedFeatures.join(" · ")}.</p>
          <div className="offer-bar">
            <strong>{seminarioPromo.offerTitle}</strong>
            <p>{seminarioPromo.offerBody}</p>
          </div>
        </article>
      </section>
    </div>
  );
}
