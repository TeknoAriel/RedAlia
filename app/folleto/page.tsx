import type { Metadata } from "next";
import { BrochureSquare } from "@/components/print/BrochureSquare";
import { FolletoToolbar } from "@/components/print/FolletoToolbar";
import "./folleto.css";

export const metadata: Metadata = {
  title: "Folleto 20×20",
  description: "Arte de impresión Redalia: folleto cuadrado 20×20 cm plegado al medio.",
  robots: { index: false, follow: false },
};

export default function FolletoPage() {
  return (
    <div className="brochure-page">
      <style>{`footer{display:none!important}`}</style>
      <FolletoToolbar />
      <BrochureSquare />
    </div>
  );
}
