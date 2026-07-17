import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Sistema } from "@/lib/cipa";
import { Relatorio } from "../../_shared/Relatorio";

export const metadata: Metadata = {
  title: "Relatório Mensal | CIPA — SmartCampus Mauá",
};

// Rota dinâmica: [sistema] vira /cipa/relatorio/trabalho e /cipa/relatorio/publico.
// Aceita ?ano=2026&mes=5 para relatórios de meses anteriores.
// (No Next 16, params e searchParams são Promises — por isso os awaits.)
export default async function RelatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ sistema: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { sistema } = await params;
  if (sistema !== "trabalho" && sistema !== "publico") notFound();

  const sp = await searchParams;
  const hoje = new Date();
  const ano = Number(sp.ano) || hoje.getFullYear();
  const mes = Math.min(12, Math.max(1, Number(sp.mes) || hoje.getMonth() + 1));

  return (
    <Relatorio
      sistema={sistema as Sistema}
      titulo={sistema === "trabalho" ? "Acidentes de Trabalho" : "Público Flutuante"}
      anoInicial={ano}
      mesInicial={mes}
    />
  );
}
