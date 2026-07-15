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
  type Gravidade,
  type Ocorrencia,
} from "@/lib/cipa";

// ===== Tipos e constantes locais =====
type TipoEvento = "acidente" | "incidente";
type Categoria = { chave: string; nome: string; cor: string };

// Categorias iniciais (as mesmas do app antigo). Novas podem ser criadas.
const CATEGORIAS_INICIAIS: Categoria[] = [
  { chave: "ceaf", nome: "CEAF", cor: "#1565c0" },
  { chave: "campus", nome: "Campus", cor: "#00897b" },
  { chave: "visitas", nome: "Visitas", cor: "#6a1b9a" },
  { chave: "outros", nome: "Outros", cor: "#546e7a" },
];

// Paleta para colorir categorias novas
const PALETA = ["#c62828", "#ad1457", "#4527a0", "#283593", "#0277bd", "#ef6c00", "#4e342e"];

// Transforma um nome em "chave" (slug): sem acentos, minúsculo, só letras/números
function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove os acentos separados pelo NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PublicPage() {
  const hoje = new Date();

  // ---- Estado principal ----
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_INICIAIS);
  const [erro, setErro] = useState<string | null>(null);

  // ---- Estado do modal ----
  const [diaAberto, setDiaAberto] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formTipo, setFormTipo] = useState<TipoEvento>("incidente");
  const [formGrav, setFormGrav] = useState<Gravidade>("red");
  const [formCat, setFormCat] = useState<string>(CATEGORIAS_INICIAIS[0].chave);
  const [formDesc, setFormDesc] = useState("");
  const [formObs, setFormObs] = useState("");

  // Carrega as ocorrências do mês a partir da API.
  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setOcorrencias(await listarOcorrencias("publico", ano, mes));
    } catch (e) {
      console.error(e);
      setErro("Não foi possível carregar do servidor. A API (porta 3001) está no ar?");
    }
  }, [ano, mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ocorrenciasDoDia = (dia: number) => ocorrencias.filter((o) => o.dia === dia);
  const nomeCategoria = (chave: string | null) =>
    categorias.find((c) => c.chave === chave)?.nome ?? chave ?? "—";

  // Resumo do mês (acidentes × incidentes)
  const resumo = useMemo(() => {
    const acid = ocorrencias.filter((o) => o.tipo === "acidente").length;
    const inc = ocorrencias.filter((o) => o.tipo === "incidente").length;
    return { acid, inc };
  }, [ocorrencias]);

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
    setFormTipo("incidente");
    setFormGrav("red");
    setFormCat(categorias[0]?.chave ?? "");
    setFormDesc("");
    setFormObs("");
    setMostrarForm(true);
  }
  function editar(o: Ocorrencia) {
    setEditId(o.id);
    setFormTipo(o.tipo === "acidente" ? "acidente" : "incidente");
    setFormGrav(o.gravidade);
    setFormCat(o.categoria ?? categorias[0]?.chave ?? "");
    setFormDesc(o.descricao);
    setFormObs(o.observacoes);
    setMostrarForm(true);
  }
  function novaCategoria() {
    const nome = prompt("Nome da nova categoria:");
    if (!nome || !nome.trim()) return;
    const chave = slugify(nome);
    if (!chave) return;
    if (categorias.some((c) => c.chave === chave)) {
      setFormCat(chave); // já existe: apenas seleciona
      return;
    }
    const cor = PALETA[categorias.length % PALETA.length];
    setCategorias((prev) => [...prev, { chave, nome: nome.trim(), cor }]);
    setFormCat(chave);
  }
  async function salvar() {
    if (diaAberto === null) return;
    const dados = {
      ano, mes, dia: diaAberto,
      gravidade: formGrav,
      tipo: formTipo,
      categoria: formCat,
      descricao: formDesc,
      observacoes: formObs,
    };
    try {
      if (editId) await atualizarOcorrencia("publico", editId, dados);
      else await criarOcorrencia("publico", dados);
      await carregar();
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
      await excluirOcorrencia("publico", id);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Link href="/cipa" className="text-sm font-semibold text-blue-700 hover:underline">
        ← Voltar para a CIPA
      </Link>

      {/* Cabeçalho + seletores */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">🔵 Público Flutuante — Digitação</h1>
          <p className="text-sm text-blue-700">
            Clique no dia, classifique (acidente/incidente), escolha a gravidade e o tipo, e descreva.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-blue-800">Ano</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(+e.target.value)}
              className="w-24 rounded-md border border-blue-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-blue-800">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(+e.target.value)}
              className="w-36 rounded-md border border-blue-300 p-2"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <Link
            href="/painel/publico"
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

      {/* Card da cruz */}
      <div className="mt-4 rounded-xl border-2 border-blue-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-blue-800">
          Cruz Verde — Público Flutuante — clique num dia para ver/adicionar
        </p>
        <p className="mb-3 text-sm text-gray-500">
          Cada registro é um <b>acidente</b> ou <b>incidente</b> (Grave/Leve + tipo + descrição).
          Use <b>+ nova</b> no formulário para criar uma categoria.
        </p>

        {/* A cruz (componente compartilhado) */}
        <CruzGrid ano={ano} mes={mes} ocorrenciasMes={ocorrencias} onDiaClick={abrirDia} />

        {/* Legenda + resumo */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-700" /> Sem ocorrência</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-600" /> Grave</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-400" /> Leve</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gray-200" /> Dia futuro</span>
        </div>
        <p className="mt-2 text-center text-sm text-blue-800">
          No mês: <b>{resumo.acid}</b> acidente(s) · <b>{resumo.inc}</b> incidente(s)
        </p>
      </div>

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
                            {o.tipo === "acidente" ? "Acidente" : "Incidente"} ·{" "}
                            {o.gravidade === "red" ? "Grave" : "Leve"} · {nomeCategoria(o.categoria)}
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
                {/* 1) Tipo: acidente ou incidente */}
                <label className="mb-1 mt-2 block text-sm font-semibold text-gray-600">
                  Foi acidente ou incidente?
                </label>
                <div className="mb-3 flex gap-2">
                  {(["acidente", "incidente"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormTipo(t)}
                      className={`flex-1 rounded-md border-2 py-2 text-sm font-semibold capitalize ${formTipo === t ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-300 bg-gray-50 text-gray-600"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* 2) Gravidade: Grave / Leve */}
                <label className="mb-1 block text-sm font-semibold text-gray-600">Gravidade</label>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setFormGrav("red")}
                    className={`flex-1 rounded-md border-2 py-2 text-sm font-semibold ${formGrav === "red" ? "border-red-600 bg-red-50 text-red-800" : "border-gray-300 bg-gray-50 text-gray-600"}`}
                  >
                    Grave
                  </button>
                  <button
                    onClick={() => setFormGrav("yellow")}
                    className={`flex-1 rounded-md border-2 py-2 text-sm font-semibold ${formGrav === "yellow" ? "border-yellow-500 bg-yellow-50 text-yellow-800" : "border-gray-300 bg-gray-50 text-gray-600"}`}
                  >
                    Leve
                  </button>
                </div>

                {/* 3) Categoria (com + nova) */}
                <label className="mb-1 block text-sm font-semibold text-gray-600">Tipo</label>
                <div className="mb-1 flex items-end gap-2">
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 p-2 text-sm"
                  >
                    {categorias.map((c) => (
                      <option key={c.chave} value={c.chave}>{c.nome}</option>
                    ))}
                  </select>
                  <button
                    onClick={novaCategoria}
                    className="whitespace-nowrap rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    + nova
                  </button>
                </div>

                <label className="mb-1 mt-2 block text-sm font-semibold text-gray-600">Descrição do ocorrido</label>
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
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
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
