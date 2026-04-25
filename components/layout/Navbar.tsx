"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getMembersPortalUrl } from "@/lib/public-contact";
import { siteConfig } from "@/lib/site-config";

const membersPortalUrl = getMembersPortalUrl();

/** Orden: institución → comunidad operativa → catálogo y accesos destacados aparte. */
const navTextLinks = [
  { href: "/que-es", label: "Qué es Redalia" },
  { href: "/socios", label: "Socios" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const propiedadesActive =
    pathname === "/propiedades" || pathname.startsWith("/propiedades/");

  const linkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-brand-navy/[0.12] bg-white/[0.97] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1 sm:px-6 lg:gap-4 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo-redalia.png"
            alt={siteConfig.name}
            width={500}
            height={500}
            className="h-14 w-auto shrink-0 sm:h-16 md:h-[4.5rem]"
            priority
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-between gap-3 xl:flex" aria-label="Principal">
          <div className="flex min-w-0 flex-wrap items-center gap-0.5 lg:gap-1">
            {navTextLinks.map(({ href, label }) => {
              const active = linkActive(href);
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

          <div className="flex shrink-0 items-center gap-2.5" aria-label="Accesos destacados">
            <Link
              href="/propiedades"
              className={`inline-flex items-center rounded-full px-4 py-2.5 text-[0.92rem] font-semibold leading-none shadow-md transition ${
                propiedadesActive
                  ? "bg-brand-navy text-white ring-2 ring-brand-gold/70 ring-offset-2 ring-offset-white"
                  : "bg-brand-gold text-brand-navy hover:bg-[#d4b82e] hover:shadow-lg"
              }`}
            >
              Catálogo
            </Link>
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
            <div className="flex flex-col gap-1 border-b border-brand-navy/10 pb-3">
              {navTextLinks.map(({ href, label }) => {
                const active = linkActive(href);
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
            </div>

            <div className="space-y-2 pt-3">
              <Link
                href="/propiedades"
                className={`flex w-full items-center justify-center rounded-full px-4 py-3.5 text-center text-sm font-semibold shadow-md transition ${
                  propiedadesActive
                    ? "bg-brand-navy text-white ring-2 ring-brand-gold/60"
                    : "bg-brand-gold text-brand-navy hover:bg-[#d4b82e]"
                }`}
                onClick={() => setOpen(false)}
              >
                Catálogo
              </Link>
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
