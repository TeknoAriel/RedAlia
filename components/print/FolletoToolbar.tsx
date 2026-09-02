"use client";

import { useEffect } from "react";
import Link from "next/link";

export function FolletoToolbar() {
  useEffect(() => {
    const el = document.querySelector("footer");
    if (!(el instanceof HTMLElement)) return;
    const previous = el.style.display;
    el.style.display = "none";
    return () => {
      el.style.display = previous;
    };
  }, []);
  return (
    <div className="brochure-toolbar no-print">
      <p>
        Folleto 20×20 cm cerrado (40×20 cm abierto). Frente: dorso + portada. Dorso de hoja: interior perfil + planes.
        En el diálogo de impresión: tamaño 400×200 mm, márgenes 0, dos caras, voltear por el lado corto.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/seminario" className="print-btn" style={{ background: "#fff", color: "#0f265c" }}>
          Ver landing QR
        </Link>
        <button type="button" className="print-btn" onClick={() => window.print()}>
          Imprimir / PDF
        </button>
      </div>
    </div>
  );
}
