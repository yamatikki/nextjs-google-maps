"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CruzGrid } from "../_shared/CruzGrid";
import { MESES } from "../_shared/cruz";
import {
  listarOcorrencias,
  criarOcorrencia,
  atualizarOcorrencia,
  excluirOcorrencia,
  obterKpi,
  salvarKpi,
  type Gravidade,
  type Kpi,
  type Ocorrencia,
} from "@/lib/cipa";

const HORAS_PADRAO = 109340; // horas-homem padrão do mês, se não informado

export default function WorkPage() {
  const hoje = new Date();

  // ---- Estado principal ----
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [aba, setAba] = useState<"cruz" | "freq">("cruz");
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  // Horas-homem e dias perdidos do mês (persistidos no banco via API).
  const [kpiMes, setKpiMes] = useState<Kpi>({ horas_homem: 0, dias_perdidos: 0 });
  const [kpiMsg, setKpiMsg] = useState("");

  // ---- Estado do modal ----
  const [diaAberto, setDiaAberto] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formGrav, setFormGrav] = useState<Gravidade>("red");
  const [formDesc, setFormDesc] = useState("");
  const [formObs, setFormObs] = useState("");

  // Carrega as ocorrências + horas/dias do mês a partir da API.
  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const [occ, kpi] = await Promise.all([
        listarOcorrencias("trabalho", ano, mes),
        obterKpi(ano, mes),
      ]);
      setOcorrencias(occ);
      setKpiMes(kpi);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível carregar do servidor. A API (porta 3001) está no ar?");
    }
  }, [ano, mes]);

  // Recarrega sempre que o ano/mês muda (e na primeira vez que a tela abre).
  useEffect(() => {
    carregar();
  }, [carregar]);

  const ocorrenciasDoDia = (dia: number) => ocorrencias.filter((o) => o.dia === dia);

  // Taxas calculadas a partir da cruz (padrão de segurança do trabalho, meta 0)
  const calc = useMemo(() => {
    const com = ocorrencias.filter((o) => o.gravidade === "red").length;
    const sem = ocorrencias.filter((o) => o.gravidade === "yellow").length;
    const total = com + sem;
    const horas = kpiMes.horas_homem || HORAS_PADRAO;
    const taxa = (n: number) => (horas ? +((n * 1_000_000) / horas).toFixed(2) : 0);
    return {
      com, sem, total,
      freq: taxa(total),
      freqCom: taxa(com),
      freqSem: taxa(sem),
      grav: taxa(kpiMes.dias_perdidos), // taxa de gravidade usa os dias perdidos
    };
  }, [ocorrencias, kpiMes]);

  // ---- Ações do modal ----
  function abrirDia(dia: number) {
    setDiaAberto(dia);
    setMostrarForm(false);
    setEditId(null);
  }
  function fecharModal() {
    setDiaAberto(null);
    setMostrarForm(false);
    setEditId(null);
  }
  function novo() {
    setEditId(null);
    setFormGrav("red");
    setFormDesc("");
    setFormObs("");
    setMostrarForm(true);
  }
  function editar(o: Ocorrencia) {
    setEditId(o.id);
    setFormGrav(o.gravidade);
    setFormDesc(o.descricao);
    setFormObs(o.observacoes);
    setMostrarForm(true);
  }
  async function salvar() {
    if (diaAberto === null) return;
    const dados = {
      ano, mes, dia: diaAberto,
      gravidade: formGrav,
      descricao: formDesc,
      observacoes: formObs,
    };
    try {
      if (editId) await atualizarOcorrencia("trabalho", editId, dados);
      else await criarOcorrencia("trabalho", dados);
      await carregar(); // recarrega do banco para refletir a mudança
      setMostrarForm(false);
      setEditId(null);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar.");
    }
  }
  async function excluir(id: number) {
    if (!confirm("Excluir este registro?")) return;
    try {
      await excluirOcorrencia("trabalho", id);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir.");
    }
  }
  function setKpiCampo(campo: "horas_homem" | "dias_perdidos", valor: number) {
    setKpiMes((prev) => ({ ...prev, [campo]: valor }));
  }
  async function salvarHorasDias() {
    try {
      await salvarKpi({ ano, mes, ...kpiMes });
      setKpiMsg("✓ Salvo!");
      setTimeout(() => setKpiMsg(""), 2500);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar horas/dias.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Link href="/cipa" className="text-sm font-semibold text-green-700 hover:underline">
        ← Voltar para a CIPA
      </Link>

      {/* Cabeçalho + seletores */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">🟢 Acidentes de Trabalho — Digitação</h1>
          <p className="text-sm text-green-700">
            Marque cada acidente no dia da cruz. Pode haver vários no mesmo dia.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Ano</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(+e.target.value)}
              className="w-24 rounded-md border border-green-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-green-800">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(+e.target.value)}
              className="w-36 rounded-md border border-green-300 p-2"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <Link
            href={`/cipa/relatorio/trabalho?ano=${ano}&mes=${mes}`}
            target="_blank"
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            📄 Relatório
          </Link>
          <Link
            href={`/painel/trabalho?ano=${ano}&mes=${mes}`}
            target="_blank"
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            📺 Painel TV
          </Link>
        </div>
      </div>

      {/* Aviso de erro de conexão, se houver */}
      {erro && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Abas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {([["cruz", "1 · Cruz Verde"], ["freq", "2 · Frequência × Gravidade"]] as const).map(
          ([id, texto]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`rounded-t-md border-2 px-4 py-2 text-sm font-semibold transition-colors ${aba === id
                  ? "border-green-200 border-b-white bg-white text-green-900"
                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
            >
              {texto}
            </button>
          ),
        )}
      </div>

      {/* Aba: Cruz Verde */}
      {aba === "cruz" && (
        <div className="rounded-b-xl rounded-tr-xl border-2 border-green-200 bg-white p-5">
          <p className="mb-3 text-sm text-gray-500">
            Clique num dia para ver/adicionar acidentes. A cor do dia segue o caso mais grave.
            Os números de Frequência são contados automaticamente a partir daqui.
          </p>

          {/* A cruz (componente compartilhado) */}
          <CruzGrid ano={ano} mes={mes} ocorrenciasMes={ocorrencias} onDiaClick={abrirDia} />

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-700" /> Sem acidente</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-600" /> Com afastamento</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-400" /> Sem afastamento</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gray-200" /> Dia futuro</span>
          </div>
        </div>
      )}

      {/* Aba: Frequência × Gravidade */}
      {aba === "freq" && (
        <div className="rounded-b-xl rounded-tr-xl border-2 border-green-200 bg-white p-6">
          <p className="mb-3 text-sm text-gray-500">
            Os acidentes (c/ e s/ afastamento) vêm da <b>cruz</b>. Aqui você informa apenas as
            horas-homem e os dias perdidos do mês.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-sm font-semibold text-green-800">
                Horas-homem trabalhadas no mês
              </label>
              <input
                type="number"
                min={0}
                value={kpiMes.horas_homem || ""}
                onChange={(e) => setKpiCampo("horas_homem", +e.target.value)}
                placeholder={`${HORAS_PADRAO}`}
                className="w-full rounded-md border border-green-300 p-2"
              />
            </div>
            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-sm font-semibold text-green-800">
                Dias perdidos no mês
              </label>
              <input
                type="number"
                min={0}
                value={kpiMes.dias_perdidos || ""}
                onChange={(e) => setKpiCampo("dias_perdidos", +e.target.value)}
                className="w-full rounded-md border border-green-300 p-2"
              />
            </div>
          </div>

          <div className="mt-4 rounded-md border border-dashed border-green-300 bg-green-50 p-4">
            <h4 className="mb-2 text-sm font-bold text-green-900">CALCULADO A PARTIR DA CRUZ (meta 0)</h4>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>Acidentes c/ afastamento: <b className="text-green-900">{calc.com}</b></div>
              <div>Acidentes s/ afastamento: <b className="text-green-900">{calc.sem}</b></div>
              <div>Total de acidentes: <b className="text-green-900">{calc.total}</b></div>
              <div>Taxa de Frequência (total): <b className="text-green-900">{calc.freq}</b></div>
              <div>Taxa Freq. c/ afastamento: <b className="text-green-900">{calc.freqCom}</b></div>
              <div>Taxa Freq. s/ afastamento: <b className="text-green-900">{calc.freqSem}</b></div>
              <div>Taxa de Gravidade: <b className="text-green-900">{calc.grav}</b></div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={salvarHorasDias}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
            >
              Salvar horas/dias
            </button>
            {kpiMsg && <span className="text-sm font-semibold text-green-700">{kpiMsg}</span>}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            As taxas se atualizam sozinhas conforme você marca a cruz e informa horas/dias.
          </p>
        </div>
      )}

      {/* Modal do dia */}
      {diaAberto !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={fecharModal}
        >
          <div
            className="max-h-[92vh] w-[430px] max-w-full overflow-auto rounded-lg bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Dia {diaAberto} de {MESES[mes - 1]}
            </h3>

            {/* Lista de ocorrências do dia */}
            {!mostrarForm && (
              <>
                {ocorrenciasDoDia(diaAberto).length === 0 ? (
                  <p className="mb-2 text-sm text-gray-400">
                    Nenhum registro neste dia. Use “Adicionar novo”.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ocorrenciasDoDia(diaAberto).map((o) => (
                      <div key={o.id} className="flex items-start gap-2 rounded-md border border-gray-200 p-2">
                        <span
                          className={`mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-sm ${o.gravidade === "red" ? "bg-red-600" : "bg-yellow-500"}`}
                        />
                        <div className="flex-1 text-sm text-gray-700">
                          <b className="text-gray-800">
                            {o.gravidade === "red" ? "Com afastamento" : "Sem afastamento"}
                          </b>
                          <br />
                          {o.descricao || <i className="text-gray-400">(sem descrição)</i>}
                          {o.observacoes && (
                            <>
                              <br />
                              <span className="text-gray-500">Obs.: {o.observacoes}</span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editar(o)}
                            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluir(o.id)}
                            className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={novo}
                  className="mt-3 w-full rounded-md border-2 border-dashed border-gray-400 bg-gray-50 py-2 font-semibold text-gray-600 hover:bg-gray-100"
                >
                  ➕ Adicionar novo
                </button>
              </>
            )}

            {/* Formulário de adicionar/editar */}
            {mostrarForm && (
              <div>
                <label className="mb-1 mt-2 block text-sm font-semibold text-gray-600">Gravidade</label>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setFormGrav("red")}
                    className={`flex-1 rounded-md border-2 py-2 text-sm font-semibold ${formGrav === "red" ? "border-red-600 bg-red-50 text-red-800" : "border-gray-300 bg-gray-50 text-gray-600"}`}
                  >
                    Com afastamento
                  </button>
                  <button
                    onClick={() => setFormGrav("yellow")}
                    className={`flex-1 rounded-md border-2 py-2 text-sm font-semibold ${formGrav === "yellow" ? "border-yellow-500 bg-yellow-50 text-yellow-800" : "border-gray-300 bg-gray-50 text-gray-600"}`}
                  >
                    Sem afastamento
                  </button>
                </div>

                <label className="mb-1 block text-sm font-semibold text-gray-600">Descrição do ocorrido</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="O que aconteceu..."
                  className="min-h-[48px] w-full rounded-md border border-gray-300 p-2 text-sm"
                />

                <label className="mb-1 mt-2 block text-sm font-semibold text-gray-600">Observações</label>
                <textarea
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  placeholder="Opcional..."
                  className="min-h-[48px] w-full rounded-md border border-gray-300 p-2 text-sm"
                />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={salvar}
                    className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setMostrarForm(false); setEditId(null); }}
                    className="rounded-md bg-gray-400 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
