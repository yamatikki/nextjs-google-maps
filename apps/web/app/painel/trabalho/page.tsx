import type { Metadata } from "next";
import { PainelCruz } from "../_shared/PainelCruz";

export const metadata: Metadata = {
  title: "Cruz Verde — Acidentes de Trabalho",
};

// Aceita ?ano=2026&mes=5 na URL para exibir meses anteriores.
// (No Next 16, searchParams é uma Promise — por isso o await.)
export default async function PainelTrabalho({
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
      sistema="trabalho"
      ano={ano}
      mes={mes}
      titulo="ACIDENTES DE TRABALHO"
      labelRed="Acidentes c/ afast."
      labelYellow="Acidentes s/ afast."
      streakLabel="Dias consecutivos sem acidente de trabalho"
    />
  );
}
