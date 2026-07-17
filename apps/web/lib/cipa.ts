// Acesso à API da CIPA (mesmo padrão de lib/api.ts).
// Chamado do navegador (Client Components), por isso usa NEXT_PUBLIC_API_URL.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Sistema = "trabalho" | "publico";
export type Gravidade = "red" | "yellow";

// Uma ocorrência como o servidor devolve (id numérico vindo do banco).
export type Ocorrencia = {
  id: number;
  sistema: Sistema;
  ano: number;
  mes: number;
  dia: number;
  gravidade: Gravidade;
  tipo: string | null;
  categoria: string | null;
  descricao: string;
  observacoes: string;
};

// Dados enviados ao criar/editar (o servidor cuida do id e do sistema).
export type OcorrenciaEntrada = {
  ano: number;
  mes: number;
  dia: number;
  gravidade: Gravidade;
  tipo?: string;
  categoria?: string;
  descricao?: string;
  observacoes?: string;
};

const base = (sistema: Sistema) => `${API_URL}/cipa/${sistema}/ocorrencias`;

export async function listarOcorrencias(
  sistema: Sistema,
  ano: number,
  mes: number,
): Promise<Ocorrencia[]> {
  const res = await fetch(`${base(sistema)}?ano=${ano}&mes=${mes}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao listar ocorrências (${res.status})`);
  return res.json();
}

export async function criarOcorrencia(
  sistema: Sistema,
  dados: OcorrenciaEntrada,
): Promise<Ocorrencia> {
  const res = await fetch(base(sistema), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error(`Falha ao criar ocorrência (${res.status})`);
  return res.json();
}

export async function atualizarOcorrencia(
  sistema: Sistema,
  id: number,
  dados: OcorrenciaEntrada,
): Promise<Ocorrencia> {
  const res = await fetch(`${base(sistema)}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error(`Falha ao editar ocorrência (${res.status})`);
  return res.json();
}

export async function excluirOcorrencia(sistema: Sistema, id: number): Promise<void> {
  const res = await fetch(`${base(sistema)}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Falha ao excluir ocorrência (${res.status})`);
}

// ===== Categorias do Público Flutuante =====

export type Categoria = { chave: string; nome: string; cor: string };

export async function listarCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/cipa/publico/categorias`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao listar categorias (${res.status})`);
  return res.json();
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  const res = await fetch(`${API_URL}/cipa/publico/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  if (!res.ok) throw new Error(`Falha ao criar categoria (${res.status})`);
  return res.json();
}

// ===== KPI (horas-homem / dias perdidos) — só trabalho =====

export type Kpi = { horas_homem: number; dias_perdidos: number };

export async function obterKpi(ano: number, mes: number): Promise<Kpi> {
  const res = await fetch(`${API_URL}/cipa/trabalho/kpi?ano=${ano}&mes=${mes}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao carregar horas/dias (${res.status})`);
  return res.json();
}

export async function salvarKpi(dados: Kpi & { ano: number; mes: number }): Promise<void> {
  const res = await fetch(`${API_URL}/cipa/trabalho/kpi`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error(`Falha ao salvar horas/dias (${res.status})`);
}

// ===== Painel (telas de TV) =====

export type Contagem = {
  atual: number;
  recorde: number;
  ultimo: string | null;
  inicio: string;
};

export type KpiMesPainel = {
  horas_homem: number;
  dias_perdidos: number;
  acid_com: number;
  acid_sem: number;
  total: number;
  taxa_freq: number;
  taxa_freq_com: number;
  taxa_freq_sem: number;
  taxa_grav: number;
};

export type KpiAnoItem = {
  mes: number;
  com: number;
  sem: number;
  taxa_freq_com: number;
  taxa_freq_sem: number;
  taxa_grav: number;
};

export type Painel = {
  ano: number;
  mes: number;
  ocorrencias_mes: Ocorrencia[];
  contagem: Contagem;
  // só trabalho:
  kpi_mes?: KpiMesPainel;
  kpi_ano?: KpiAnoItem[];
  // só público:
  categorias?: Categoria[];
  resumo_tipo?: { acidente: number; incidente: number };
  categorias_mes?: Record<string, number>;
  categorias_ano?: Record<string, number[]>;
};

export async function obterPainel(sistema: Sistema, ano: number, mes: number): Promise<Painel> {
  const res = await fetch(`${API_URL}/cipa/${sistema}/painel?ano=${ano}&mes=${mes}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao carregar painel (${res.status})`);
  return res.json();
}
