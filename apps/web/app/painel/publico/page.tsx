import type { Metadata } from "next";
import { PainelCruz } from "../_shared/PainelCruz";

export const metadata: Metadata = {
  title: "Cruz Verde — Público Flutuante",
};

// Aceita ?ano=2026&mes=5 na URL para exibir meses anteriores.
// (No Next 16, searchParams é uma Promise — por isso o await.)
export default async function PainelPublico({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const sp = await searchParams;
  const hoje = new Date();
  const ano = Number(sp.ano) || hoje.getFullYear();
  const mes = Math.min(12, Math.max(1, Number(sp.mes) || hoje.getMonth() + 1));

  return (
    <PainelCruz
      sistema="publico"
      ano={ano}
      mes={mes}
      titulo="PÚBLICO FLUTUANTE"
      labelRed="Ocorrências graves"
      labelYellow="Ocorrências leves"
      streakLabel="Dias consecutivos sem ocorrência"
    />
  );
}
