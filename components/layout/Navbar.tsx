"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getMembersPortalUrl } from "@/lib/public-contact";
import { siteConfig } from "@/lib/site-config";

const membersPortalUrl = getMembersPortalUrl();

const catalogoItems = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/socios", label: "Socios / Corredoras" },
];

const serviciosItems = [
  { href: "/colaboracion", label: "Canje y colaboración" },
  { href: "/capacitacion", label: "Capacitación" },
  { href: "/planes", label: "Membresía" },
  { href: "/servicios", label: "Herramientas para corredoras" },
];

const mainLinks = [
  { href: "/", label: "Inicio" },
  { href: "/que-es", label: "Qué es Redalia" },
  { href: "/unete", label: "Únete" },
  { href: "/contacto", label: "Contacto" },
];

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function catalogoSectionActive(pathname: string): boolean {
  return pathname.startsWith("/propiedades") || pathname.startsWith("/catalogo") || pathname.startsWith("/socios");
}

function serviciosSectionActive(pathname: string): boolean {
  return (
    pathname.startsWith("/colaboracion") ||
    pathname.startsWith("/capacitacion") ||
    pathname.startsWith("/planes") ||
    pathname.startsWith("/servicios")
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileCatalogo, setMobileCatalogo] = useState(false);
  const [mobileServicios, setMobileServicios] = useState(false);

  const catalogoActive = catalogoSectionActive(pathname);
  const serviciosActive = serviciosSectionActive(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-navy/[0.12] bg-white/[0.97] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1 sm:px-6 lg:gap-4 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center" onClick={() => setOpen(false)}>
          <Image
            src="/logo-redalia.png"
            alt={siteConfig.name}
            width={500}
            height={500}
            className="h-14 w-auto shrink-0 sm:h-16 md:h-[4.5rem]"
            priority
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-between gap-2 xl:flex" aria-label="Principal">
          <div className="flex min-w-0 flex-wrap items-center gap-0.5 lg:gap-0.5">
            {mainLinks.slice(0, 2).map(({ href, label }) => {
              const active = linkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors lg:px-2.5 ${
                    active
                      ? "bg-brand-navy-soft text-brand-navy"
                      : "text-brand-navy/80 hover:bg-brand-navy-soft/60 hover:text-brand-navy"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors lg:px-2.5 ${
                  catalogoActive
                    ? "bg-brand-navy-soft text-brand-navy"
                    : "text-brand-navy/80 hover:bg-brand-navy-soft/60 hover:text-brand-navy"
                }`}
                aria-expanded={false}
                aria-haspopup="true"
              >
                Catálogo
                <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100"
                role="menu"
              >
                <div className="min-w-[13rem] rounded-xl border border-brand-navy/10 bg-white py-2 shadow-lg">
                  {catalogoItems.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`block px-4 py-2.5 text-sm ${
                        linkActive(pathname, it.href)
                          ? "bg-brand-navy-soft font-semibold text-brand-navy"
                          : "text-brand-navy/85 hover:bg-brand-navy-soft/50"
                      }`}
                      role="menuitem"
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors lg:px-2.5 ${
                  serviciosActive
                    ? "bg-brand-navy-soft text-brand-navy"
                    : "text-brand-navy/80 hover:bg-brand-navy-soft/60 hover:text-brand-navy"
                }`}
                aria-haspopup="true"
              >
                Servicios
                <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100">
                <div className="min-w-[15rem] rounded-xl border border-brand-navy/10 bg-white py-2 shadow-lg">
                  {serviciosItems.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`block px-4 py-2.5 text-sm ${
                        linkActive(pathname, it.href)
                          ? "bg-brand-navy-soft font-semibold text-brand-navy"
                          : "text-brand-navy/85 hover:bg-brand-navy-soft/50"
                      }`}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {mainLinks.slice(2).map(({ href, label }) => {
              const active = linkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors lg:px-2.5 ${
                    active
                      ? "bg-brand-navy-soft text-brand-navy"
                      : "text-brand-navy/80 hover:bg-brand-navy-soft/60 hover:text-brand-navy"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2" aria-label="Acceso socios">
            <a
              href={membersPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-mid"
            >
              Acceso socios
              <span className="sr-only">(abre en nueva pestaña)</span>
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-brand-navy"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menú</span>
            {open ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-navy/10 bg-white px-4 py-4 xl:hidden">
          <p className="redalia-nav-lockup mb-3 border-b border-brand-navy/10 pb-3 text-center text-xs sm:hidden">
            {siteConfig.brandLockup}
          </p>
          <nav className="flex flex-col gap-1" aria-label="Móvil">
            {mainLinks.slice(0, 2).map(({ href, label }) => {
              const active = linkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-3 text-base font-medium ${
                    active ? "bg-brand-navy-soft text-brand-navy" : "text-brand-navy hover:bg-brand-navy-soft"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            <div className="rounded-lg border border-brand-navy/10 bg-brand-navy-soft/30">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left text-base font-semibold text-brand-navy"
                aria-expanded={mobileCatalogo}
                onClick={() => setMobileCatalogo((v) => !v)}
              >
                Catálogo
                <span className="text-xs text-muted">{mobileCatalogo ? "▲" : "▼"}</span>
              </button>
              {mobileCatalogo && (
                <div className="border-t border-brand-navy/10 bg-white px-2 py-2">
                  {catalogoItems.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-navy hover:bg-brand-navy-soft"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-brand-navy/10 bg-brand-navy-soft/30">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left text-base font-semibold text-brand-navy"
                aria-expanded={mobileServicios}
                onClick={() => setMobileServicios((v) => !v)}
              >
                Servicios
                <span className="text-xs text-muted">{mobileServicios ? "▲" : "▼"}</span>
              </button>
              {mobileServicios && (
                <div className="border-t border-brand-navy/10 bg-white px-2 py-2">
                  {serviciosItems.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-navy hover:bg-brand-navy-soft"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {mainLinks.slice(2).map(({ href, label }) => {
              const active = linkActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-3 text-base font-medium ${
                    active ? "bg-brand-navy-soft text-brand-navy" : "text-brand-navy hover:bg-brand-navy-soft"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            <div className="border-t border-brand-navy/10 pt-3">
              <a
                href={membersPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-navy px-4 py-3.5 text-center text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Acceso socios
                <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
