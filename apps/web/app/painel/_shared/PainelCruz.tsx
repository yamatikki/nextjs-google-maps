"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { obterPainel, type Painel, type Sistema } from "@/lib/cipa";
import { MESES, montarCruz, diasNoMes, corDoDia, type CorDia } from "../../seguranca/_shared/cruz";

// Cores vivas das células (para leitura à distância, na TV).
// O painel do trabalho usa a cruz verde; o do público flutuante, azul.
const CORES_VERDE: Record<CorDia, string> = {
  green: "bg-green-600 text-green-100 border-green-800",
  red: "bg-red-600 text-white border-red-800",
  yellow: "bg-yellow-400 text-yellow-900 border-yellow-600",
  blank: "bg-gray-200 text-gray-400 border-gray-300",
};
const CORES_AZUL: Record<CorDia, string> = {
  green: "bg-blue-700 text-blue-100 border-blue-900", // dia sem ocorrência
  red: "bg-red-600 text-white border-red-800",
  yellow: "bg-yellow-400 text-yellow-900 border-yellow-600",
  blank: "bg-gray-200 text-gray-400 border-gray-300",
};

// Iniciais dos meses no eixo dos gráficos (J F M A M J J A S O N D).
const INICIAIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Nome/cor das categorias conhecidas do Público Flutuante + paleta pra novas.
const NOME_CAT: Record<string, string> = {
  ceaf: "CEAF",
  campus: "Campus",
  visitas: "Visitas",
  outros: "Outros",
};
const COR_CAT: Record<string, string> = {
  ceaf: "#1565c0",
  campus: "#00897b",
  visitas: "#6a1b9a",
  outros: "#546e7a",
};
const PALETA = ["#c62828", "#ad1457", "#4527a0", "#283593", "#0277bd", "#ef6c00", "#4e342e"];

function fmtBR(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// Cartão de gráfico: título + legenda + área que preenche o espaço restante.
function ChartCard({
  titulo,
  legenda,
  azul,
  children,
}: {
  titulo: string;
  legenda?: React.ReactNode;
  azul?: boolean; // Público Flutuante usa cartões azuis (como no modelo antigo)
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col rounded-lg border-2 p-2 ${
        azul ? "border-blue-200 bg-blue-50/40" : "border-green-200 bg-green-50/40"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <span className={`text-sm font-bold ${azul ? "text-blue-900" : "text-green-900"}`}>
          {titulo}
        </span>
        {legenda}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function PainelCruz({
  sistema,
  titulo,
  labelRed,
  labelYellow,
  streakLabel,
  ano,
  mes,
}: {
  sistema: Sistema;
  titulo: string;
  labelRed: string;
  labelYellow: string;
  streakLabel: string;
  ano: number; // definidos pela página via ?ano=&mes= (padrão: mês atual)
  mes: number;
}) {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [agora, setAgora] = useState<Date>(() => new Date());
  const [atualizadoEm, setAtualizadoEm] = useState("—");

  // Busca o pacote agregado do painel na API.
  const carregar = useCallback(async () => {
    try {
      setPainel(await obterPainel(sistema, ano, mes));
      setAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error(e);
    }
  }, [sistema, ano, mes]);

  // Carrega ao abrir e recarrega sozinho a cada 60s (a TV fica sempre atual).
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 60_000);
    return () => clearInterval(t);
  }, [carregar]);

  // Relógio: atualiza a hora a cada 30s.
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // O painel do Público Flutuante é AZUL (destaques e a própria cruz);
  // o de Acidentes de Trabalho mantém a cruz verde clássica.
  const azul = sistema === "publico";
  const CORES = azul ? CORES_AZUL : CORES_VERDE;

  const occMes = painel?.ocorrencias_mes ?? [];
  const contagem = painel?.contagem ?? { atual: 0, recorde: 0, ultimo: null, inicio: "" };
  const ocorrenciasDoDia = (dia: number) => occMes.filter((o) => o.dia === dia);
  const celulas = montarCruz(diasNoMes(ano, mes));
  const ehMesAtual = agora.getFullYear() === ano && agora.getMonth() + 1 === mes;
  const vermelhos = occMes.filter((o) => o.gravidade === "red").length;
  const amarelos = occMes.filter((o) => o.gravidade === "yellow").length;

  // ---- Dados dos gráficos ----
  const kpiAno = painel?.kpi_ano ?? [];
  const dadosFreq = kpiAno.map((k, i) => ({
    m: INICIAIS[i],
    "C/ afastamento": k.taxa_freq_com,
    "S/ afastamento": k.taxa_freq_sem,
  }));
  const dadosGrav = kpiAno.map((k, i) => ({ m: INICIAIS[i], Gravidade: k.taxa_grav }));

  const catAno = painel?.categorias_ano ?? {};
  // Nome/cor/ordem vêm do banco (painel.categorias); os mapas locais são
  // apenas reserva caso o payload venha sem a lista.
  const catsInfo = painel?.categorias ?? [];
  const ordemBase = catsInfo.length
    ? catsInfo.map((c) => c.chave)
    : ["ceaf", "campus", "visitas", "outros"];
  const chavesCat = [
    ...ordemBase.filter((c) => catAno[c]),
    ...Object.keys(catAno).filter((c) => !ordemBase.includes(c)).sort(),
  ];
  const nomeDe = (chave: string) =>
    catsInfo.find((c) => c.chave === chave)?.nome ??
    NOME_CAT[chave] ??
    chave.charAt(0).toUpperCase() + chave.slice(1);
  const corDe = (chave: string, idx: number) =>
    catsInfo.find((c) => c.chave === chave)?.cor ?? COR_CAT[chave] ?? PALETA[idx % PALETA.length];
  const dadosCat = INICIAIS.map((ini, i) => {
    const linha: Record<string, number | string> = { m: ini };
    chavesCat.forEach((c) => {
      linha[nomeDe(c)] = catAno[c]?.[i] ?? 0;
    });
    return linha;
  });
  const totMes = Object.values(painel?.categorias_mes ?? {}).reduce((a, b) => a + b, 0);
  const rt = painel?.resumo_tipo ?? { acidente: 0, incidente: 0 };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-green-100 p-3">
      {/* Cabeçalho */}
      <header className="flex shrink-0 items-center justify-between rounded-t-lg border-b-4 border-green-950 bg-[#5a7a2a] px-6 py-2 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/seguranca-do-trabalho.jpg"
          alt="Segurança do Trabalho — Instituto Mauá"
          className="h-14 w-auto rounded bg-white p-1"
        />
        <div className="text-center">
          <div className="text-3xl font-extrabold tracking-[0.3em]">CRUZ VERDE</div>
          <div className="mt-0.5 text-base tracking-widest text-green-100">
            {titulo} · {MESES[mes - 1].toUpperCase()} / {ano}
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-3xl font-bold">
            {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-xs capitalize text-green-100">
            {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
        </div>
      </header>

      {/* Corpo: esquerda = cruz + contagem; direita = gráficos do ano */}
      <div className="grid min-h-0 flex-1 grid-cols-[42%_58%] gap-4 border-4 border-t-0 border-green-800 bg-white p-4">
        {/* Coluna esquerda */}
        <div
          className="flex min-h-0 flex-col items-center justify-between gap-3"
          style={{ "--d": "min(46vh, 30vw)" } as React.CSSProperties}
        >
          {/* A cruz dentro do círculo verde */}
          <div
            className={`flex shrink-0 items-center justify-center rounded-full border-8 ${azul ? "border-blue-950" : "border-green-900"}`}
            style={{
              width: "calc(var(--d) * 1.16)",
              height: "calc(var(--d) * 1.16)",
              background: azul
                ? "radial-gradient(circle at 42% 32%, #60a5fa 0%, #1d4ed8 40%, #172554 100%)"
                : "radial-gradient(circle at 42% 32%, #5cb85c 0%, #2e7d32 40%, #1b5e20 100%)",
            }}
          >
            <div
              className="grid grid-cols-7 rounded bg-white/95"
              style={{ gap: "calc(var(--d) / 105)", padding: "calc(var(--d) / 48)" }}
            >
              {celulas.map((dia, i) => {
                const lado = "calc(var(--d) / 10.5)";
                if (dia === 0) return <div key={i} style={{ width: lado, height: lado }} />;
                const cor = corDoDia(ocorrenciasDoDia(dia), ano, mes, dia);
                const eHoje = ehMesAtual && dia === agora.getDate();
                return (
                  <div
                    key={i}
                    style={{ width: lado, height: lado, fontSize: "calc(var(--d) / 26)" }}
                    className={`flex items-center justify-center rounded border-2 font-semibold ${CORES[cor]} ${eHoje ? "ring-4 ring-yellow-300" : ""}`}
                  >
                    {dia}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dias consecutivos + recorde */}
          <div
            className={`flex w-full items-center gap-4 rounded-lg border-2 px-4 py-2 ${
              azul
                ? "border-blue-800 bg-gradient-to-br from-blue-50 to-sky-50"
                : "border-green-800 bg-gradient-to-br from-green-50 to-lime-50"
            }`}
          >
            <div
              className={`text-6xl font-bold leading-none ${azul ? "text-blue-800" : "text-green-700"}`}
            >
              {contagem.atual}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-bold uppercase leading-tight ${azul ? "text-blue-900" : "text-green-900"}`}
              >
                {streakLabel}
              </div>
              <div className="text-sm font-bold text-orange-600">
                🏆 Recorde: {contagem.recorde} dias
              </div>
              <div className="text-xs text-gray-500">
                {contagem.ultimo
                  ? `Última ocorrência: ${fmtBR(contagem.ultimo)}`
                  : `Sem ocorrências desde ${fmtBR(contagem.inicio) ?? "—"}`}
              </div>
            </div>
          </div>

          {/* Contadores do mês */}
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-lg border-2 border-red-800 text-center">
              <div className="bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-gray-700">
                {labelRed} (mês)
              </div>
              <div className="bg-red-600 py-2 text-4xl font-bold text-white">{vermelhos}</div>
            </div>
            <div className="overflow-hidden rounded-lg border-2 border-yellow-600 text-center">
              <div className="bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-gray-700">
                {labelYellow} (mês)
              </div>
              <div className="bg-yellow-400 py-2 text-4xl font-bold text-yellow-900">
                {amarelos}
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-200 pt-2 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5"><span className={`h-3.5 w-6 rounded border border-black/20 ${azul ? "bg-blue-700" : "bg-green-600"}`} /> Sem ocorrência</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-6 rounded border border-black/20 bg-red-600" /> {labelRed}</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-6 rounded border border-black/20 bg-yellow-400" /> {labelYellow}</span>
            <span className="flex items-center gap-1.5"><span className="h-3.5 w-6 rounded border border-black/20 bg-gray-200" /> Dia futuro</span>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex min-h-0 flex-col gap-3">
          {sistema === "trabalho" ? (
            <>
              <div className="shrink-0 border-b-2 border-blue-900 pb-1 text-center font-bold tracking-wider text-blue-900">
                FREQUÊNCIA × GRAVIDADE — {ano}
              </div>
              <ChartCard
                titulo="Taxa de Frequência"
                legenda={
                  <span className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-[#c62828]" /> C/ afastamento</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-[#f9a825]" /> S/ afastamento</span>
                    <span className="text-green-800">
                      Mês: {painel?.kpi_mes?.taxa_freq ?? 0}
                    </span>
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosFreq} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReferenceLine
                      y={0}
                      stroke="#d32f2f"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      label={{ value: "META 0", position: "insideBottomRight", fill: "#d32f2f", fontSize: 10 }}
                    />
                    <Bar dataKey="C/ afastamento" fill="#c62828" />
                    <Bar dataKey="S/ afastamento" fill="#f9a825" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard
                titulo="Taxa de Gravidade (dias perdidos)"
                legenda={
                  <span className="text-xs font-semibold text-green-800">
                    Mês: {painel?.kpi_mes?.taxa_grav ?? 0}
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrav} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReferenceLine
                      y={0}
                      stroke="#d32f2f"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      label={{ value: "META 0", position: "insideBottomRight", fill: "#d32f2f", fontSize: 10 }}
                    />
                    <Bar dataKey="Gravidade" fill="#1a3f8a" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          ) : (
            <>
              <div className="shrink-0 border-b-2 border-blue-900 pb-1 text-center font-bold tracking-wider text-blue-900">
                PÚBLICO FLUTUANTE POR CATEGORIA — {ano}
              </div>
              <ChartCard
                titulo="Ocorrências por mês"
                azul
                legenda={
                  <span className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600">
                    {chavesCat.map((c, i) => (
                      <span key={c} className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm" style={{ background: corDe(c, i) }} />
                        {nomeDe(c)}
                      </span>
                    ))}
                    <span className="text-blue-800">
                      Mês: {totMes} ({rt.acidente} ac. · {rt.incidente} inc.)
                    </span>
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosCat} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <ReferenceLine
                      y={0}
                      stroke="#d32f2f"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      label={{ value: "META 0", position: "insideBottomRight", fill: "#d32f2f", fontSize: 10 }}
                    />
                    {chavesCat.map((c, i) => (
                      <Bar key={c} dataKey={nomeDe(c)} stackId="a" fill={corDe(c, i)} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Cards por categoria (mês) */}
              <div className="grid shrink-0 grid-cols-4 gap-3">
                {chavesCat.length ? (
                  chavesCat.map((c, i) => (
                    <div
                      key={c}
                      className="rounded-md border-2 border-gray-200 bg-white p-2 text-center"
                      style={{ borderLeftColor: corDe(c, i), borderLeftWidth: 6 }}
                    >
                      <div className="text-3xl font-bold leading-none text-gray-800">
                        {painel?.categorias_mes?.[c] ?? 0}
                      </div>
                      <div className="text-xs font-bold uppercase text-gray-500">{nomeDe(c)}</div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-4 text-sm text-gray-400">
                    Sem categorias registradas ainda.
                  </p>
                )}
              </div>

              {/* Descrições das ocorrências do mês */}
              <div className="min-h-[3rem] flex-1 overflow-auto rounded-md border border-blue-200 bg-blue-50/50 p-2 text-sm text-gray-700">
                {occMes.length
                  ? occMes.map((o) => (
                      <p key={o.id}>
                        {o.gravidade === "red" ? "🔴" : "🟡"}{" "}
                        <b>
                          {String(o.dia).padStart(2, "0")} ·{" "}
                          {o.tipo === "acidente" ? "Acidente" : "Incidente"} ·{" "}
                          {nomeDe(o.categoria ?? "outros")}:
                        </b>{" "}
                        {o.descricao || "(sem descrição)"}{" "}
                        {o.observacoes && <i>({o.observacoes})</i>}
                      </p>
                    ))
                  : "Sem ocorrências registradas no mês."}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <footer className="flex shrink-0 justify-between rounded-b-lg border-4 border-t-0 border-green-800 bg-white px-4 py-1 text-xs text-gray-400">
        <span>
          {azul
            ? "Indicador de Público Flutuante · Segurança do Trabalho · Instituto Mauá de Tecnologia"
            : "Indicador de Segurança do Trabalho · Instituto Mauá de Tecnologia"}
        </span>
        <span>Atualizado: {atualizadoEm}</span>
      </footer>
    </div>
  );
}
