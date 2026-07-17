"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { obterPainel, type Painel, type Sistema } from "@/lib/cipa";
import { MESES } from "./cruz";

// Rótulos de gravidade de cada sistema (red/yellow).
const ROTULOS: Record<Sistema, { red: string; yellow: string }> = {
  trabalho: { red: "Com afastamento", yellow: "Sem afastamento" },
  publico: { red: "Grave", yellow: "Leve" },
};

function fmtBR(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function Relatorio({
  sistema,
  titulo,
  anoInicial,
  mesInicial,
}: {
  sistema: Sistema;
  titulo: string;
  anoInicial: number;
  mesInicial: number;
}) {
  const [ano, setAno] = useState(anoInicial);
  const [mes, setMes] = useState(mesInicial);
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setPainel(await obterPainel(sistema, ano, mes));
    } catch (e) {
      console.error(e);
      setErro("Não foi possível carregar os dados. A API (porta 3001) está no ar?");
    }
  }, [sistema, ano, mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const rot = ROTULOS[sistema];
  const occ = painel?.ocorrencias_mes ?? [];
  const com = occ.filter((o) => o.gravidade === "red").length;
  const sem = occ.filter((o) => o.gravidade === "yellow").length;
  const contagem = painel?.contagem;
  const kpi = painel?.kpi_mes;
  const categorias = painel?.categorias ?? [];
  const catMes = painel?.categorias_mes ?? {};
  const rt = painel?.resumo_tipo ?? { acidente: 0, incidente: 0 };
  const voltarPara = sistema === "trabalho" ? "/cipa/work" : "/cipa/public";

  // Avaliação automática do mês (mesma regra do app antigo):
  // NEGATIVO se houve caso grave/c-afastamento; ATENÇÃO se só leves; POSITIVO se nenhum.
  const avaliacao =
    com > 0
      ? { texto: "NEGATIVO", cor: "border-red-600 bg-red-50 text-red-800", detalhe: `O mês registrou ${com} ocorrência(s) "${rot.red}".` }
      : sem > 0
        ? { texto: "ATENÇÃO", cor: "border-yellow-500 bg-yellow-50 text-yellow-800", detalhe: `O mês registrou apenas ocorrência(s) "${rot.yellow}".` }
        : { texto: "POSITIVO", cor: "border-green-600 bg-green-50 text-green-800", detalhe: "Nenhuma ocorrência registrada no mês. Meta 0 atingida." };

  return (
    <main className="mx-auto w-full max-w-3xl p-6 print:max-w-none print:p-0">
      {/* Barra de ações — some na impressão (print:hidden) */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <Link href={voltarPara} className="text-sm font-semibold text-green-700 hover:underline">
          ← Voltar para a digitação
        </Link>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Ano</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(+e.target.value)}
              className="w-24 rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(+e.target.value)}
              className="w-36 rounded-md border border-gray-300 p-2 text-sm"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 print:hidden">
          {erro}
        </div>
      )}

      {/* Cabeçalho do documento */}
      <header className="mb-5 flex items-center gap-4 border-b-4 border-green-700 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/seguranca-do-trabalho.jpg"
          alt="Segurança do Trabalho — Instituto Mauá de Tecnologia"
          className="h-16 w-auto"
        />
        <div>
          <h1 className="text-2xl font-bold text-green-900">Relatório Mensal — {titulo}</h1>
          <p className="text-sm text-gray-600">
            {MESES[mes - 1]} / {ano} · Cruz Verde · Segurança do Trabalho · Instituto Mauá de Tecnologia
          </p>
        </div>
      </header>

      {/* Avaliação do mês */}
      <section className={`mb-5 rounded-lg border-2 p-4 ${avaliacao.cor}`}>
        <p className="text-lg font-bold">Avaliação do mês: {avaliacao.texto}</p>
        <p className="text-sm">{avaliacao.detalhe}</p>
      </section>

      {/* Resumo em números */}
      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-gray-200 p-3 text-center">
          <div className="text-3xl font-bold text-red-700">{com}</div>
          <div className="text-xs font-semibold uppercase text-gray-500">{rot.red}</div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 text-center">
          <div className="text-3xl font-bold text-yellow-600">{sem}</div>
          <div className="text-xs font-semibold uppercase text-gray-500">{rot.yellow}</div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 text-center">
          <div className="text-3xl font-bold text-gray-800">{com + sem}</div>
          <div className="text-xs font-semibold uppercase text-gray-500">Total no mês</div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 text-center">
          <div className="text-3xl font-bold text-green-700">{contagem?.atual ?? 0}</div>
          <div className="text-xs font-semibold uppercase text-gray-500">
            Dias sem ocorrência
          </div>
        </div>
      </section>

      {/* Indicadores específicos de cada sistema */}
      {sistema === "trabalho" && kpi && (
        <section className="mb-5 rounded-md border border-dashed border-green-400 bg-green-50 p-4">
          <h2 className="mb-2 text-sm font-bold uppercase text-green-900">
            Frequência × Gravidade (meta 0)
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div>Horas-homem: <b>{kpi.horas_homem || "—"}</b></div>
            <div>Dias perdidos: <b>{kpi.dias_perdidos}</b></div>
            <div>Taxa de Frequência: <b>{kpi.taxa_freq}</b></div>
            <div>Taxa Freq. c/ afast.: <b>{kpi.taxa_freq_com}</b></div>
            <div>Taxa Freq. s/ afast.: <b>{kpi.taxa_freq_sem}</b></div>
            <div>Taxa de Gravidade: <b>{kpi.taxa_grav}</b></div>
          </div>
        </section>
      )}

      {sistema === "publico" && (
        <section className="mb-5 rounded-md border border-dashed border-blue-400 bg-blue-50 p-4">
          <h2 className="mb-2 text-sm font-bold uppercase text-blue-900">Por categoria (no mês)</h2>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {categorias.map((c) => (
              <div key={c.chave}>
                {c.nome}: <b>{catMes[c.chave] ?? 0}</b>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm">
            Classificação: <b>{rt.acidente}</b> acidente(s) · <b>{rt.incidente}</b> incidente(s)
          </p>
        </section>
      )}

      {/* Sequência de dias */}
      {contagem && (
        <section className="mb-5 text-sm text-gray-700">
          <b>{contagem.atual}</b> dia(s) consecutivo(s) sem ocorrência · 🏆 Recorde:{" "}
          <b>{contagem.recorde}</b> dia(s)
          {contagem.ultimo
            ? ` · Última ocorrência: ${fmtBR(contagem.ultimo)}`
            : ` · Sem ocorrências desde ${fmtBR(contagem.inicio) ?? "—"}`}
        </section>
      )}

      {/* Tabela de ocorrências */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold uppercase text-gray-700">
          Ocorrências registradas no mês
        </h2>
        {occ.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma ocorrência registrada. ✅</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border border-gray-300 px-2 py-1">Dia</th>
                {sistema === "publico" && (
                  <th className="border border-gray-300 px-2 py-1">Classif.</th>
                )}
                <th className="border border-gray-300 px-2 py-1">Gravidade</th>
                {sistema === "publico" && (
                  <th className="border border-gray-300 px-2 py-1">Categoria</th>
                )}
                <th className="border border-gray-300 px-2 py-1">Descrição</th>
                <th className="border border-gray-300 px-2 py-1">Observações</th>
              </tr>
            </thead>
            <tbody>
              {occ.map((o) => (
                <tr key={o.id}>
                  <td className="border border-gray-300 px-2 py-1">{String(o.dia).padStart(2, "0")}</td>
                  {sistema === "publico" && (
                    <td className="border border-gray-300 px-2 py-1">
                      {o.tipo === "acidente" ? "Acidente" : "Incidente"}
                    </td>
                  )}
                  <td className="border border-gray-300 px-2 py-1">
                    <span className={o.gravidade === "red" ? "font-semibold text-red-700" : "font-semibold text-yellow-700"}>
                      {o.gravidade === "red" ? rot.red : rot.yellow}
                    </span>
                  </td>
                  {sistema === "publico" && (
                    <td className="border border-gray-300 px-2 py-1">
                      {categorias.find((c) => c.chave === o.categoria)?.nome ?? o.categoria ?? "—"}
                    </td>
                  )}
                  <td className="border border-gray-300 px-2 py-1">{o.descricao || "—"}</td>
                  <td className="border border-gray-300 px-2 py-1">{o.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="border-t border-gray-200 pt-3 text-xs text-gray-400">
        Documento gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
        {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·
        Indicador oficial de Segurança do Trabalho · Instituto Mauá de Tecnologia
      </footer>
    </main>
  );
}
