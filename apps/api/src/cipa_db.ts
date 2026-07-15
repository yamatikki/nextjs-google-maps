// Banco de dados da CIPA — PostgreSQL via o cliente nativo do Bun (Bun.SQL).
// Nenhuma biblioteca extra: o Bun já traz o driver de Postgres embutido.
// Guarda as ocorrências das cruzes: Acidentes de Trabalho e Público Flutuante.
import { SQL } from "bun";

// A conexão vem do .env (DATABASE_URL); com um padrão local de fallback.
const sql = new SQL(
  process.env.DATABASE_URL ?? "postgres://smartcampus:smartcampus@localhost:5432/smartcampus",
);

// Cria a tabela na primeira execução (idempotente — só cria se não existir).
await sql`
  CREATE TABLE IF NOT EXISTS ocorrencias (
    id          SERIAL PRIMARY KEY,
    sistema     TEXT    NOT NULL,                 -- 'trabalho' | 'publico'
    ano         INTEGER NOT NULL,
    mes         INTEGER NOT NULL,                 -- 1..12
    dia         INTEGER NOT NULL,
    gravidade   TEXT    NOT NULL,                 -- 'red' | 'yellow'
    tipo        TEXT,                              -- 'acidente' | 'incidente' (só publico)
    categoria   TEXT,                              -- chave da categoria (só publico)
    descricao   TEXT    NOT NULL DEFAULT '',
    observacoes TEXT    NOT NULL DEFAULT '',
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

// KPI mensal do sistema "trabalho": horas-homem e dias perdidos.
// PRIMARY KEY (ano, mes) garante 1 linha por mês (o salvar faz "upsert").
await sql`
  CREATE TABLE IF NOT EXISTS kpi_trabalho (
    ano           INTEGER NOT NULL,
    mes           INTEGER NOT NULL,
    horas_homem   INTEGER NOT NULL DEFAULT 0,
    dias_perdidos INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ano, mes)
  )
`;

export type Sistema = "trabalho" | "publico";

export type Ocorrencia = {
  id: number;
  sistema: Sistema;
  ano: number;
  mes: number;
  dia: number;
  gravidade: "red" | "yellow";
  tipo: string | null;
  categoria: string | null;
  descricao: string;
  observacoes: string;
};

// Dados que chegam do site para criar/editar (id e sistema vêm da URL).
export type OcorrenciaEntrada = {
  ano: number;
  mes: number;
  dia: number;
  gravidade: "red" | "yellow";
  tipo?: string;
  categoria?: string;
  descricao?: string;
  observacoes?: string;
};

// Colunas devolvidas ao site (na ordem do tipo Ocorrencia).
const COLUNAS = sql`id, sistema, ano, mes, dia, gravidade, tipo, categoria, descricao, observacoes`;

export async function listarOcorrencias(
  sistema: Sistema,
  ano: number,
  mes: number,
): Promise<Ocorrencia[]> {
  return (await sql`
    SELECT ${COLUNAS} FROM ocorrencias
    WHERE sistema = ${sistema} AND ano = ${ano} AND mes = ${mes}
    ORDER BY dia, id
  `) as Ocorrencia[];
}

export async function criarOcorrencia(sistema: Sistema, o: OcorrenciaEntrada): Promise<Ocorrencia> {
  const [row] = await sql`
    INSERT INTO ocorrencias (sistema, ano, mes, dia, gravidade, tipo, categoria, descricao, observacoes)
    VALUES (${sistema}, ${o.ano}, ${o.mes}, ${o.dia}, ${o.gravidade},
            ${o.tipo ?? null}, ${o.categoria ?? null}, ${o.descricao ?? ""}, ${o.observacoes ?? ""})
    RETURNING ${COLUNAS}
  `;
  return row as Ocorrencia;
}

export async function atualizarOcorrencia(
  sistema: Sistema,
  id: number,
  o: OcorrenciaEntrada,
): Promise<Ocorrencia | null> {
  const [row] = await sql`
    UPDATE ocorrencias SET
      ano = ${o.ano}, mes = ${o.mes}, dia = ${o.dia}, gravidade = ${o.gravidade},
      tipo = ${o.tipo ?? null}, categoria = ${o.categoria ?? null},
      descricao = ${o.descricao ?? ""}, observacoes = ${o.observacoes ?? ""}
    WHERE id = ${id} AND sistema = ${sistema}
    RETURNING ${COLUNAS}
  `;
  return (row as Ocorrencia) ?? null;
}

export async function excluirOcorrencia(sistema: Sistema, id: number): Promise<boolean> {
  const rows = await sql`DELETE FROM ocorrencias WHERE id = ${id} AND sistema = ${sistema} RETURNING id`;
  return rows.length > 0;
}

// ===== KPI (horas-homem / dias perdidos) — só para o sistema "trabalho" =====

export type Kpi = { horas_homem: number; dias_perdidos: number };

export async function obterKpi(ano: number, mes: number): Promise<Kpi> {
  const [row] = await sql`
    SELECT horas_homem, dias_perdidos FROM kpi_trabalho WHERE ano = ${ano} AND mes = ${mes}
  `;
  return (row as Kpi) ?? { horas_homem: 0, dias_perdidos: 0 };
}

export async function salvarKpi(ano: number, mes: number, k: Kpi): Promise<void> {
  await sql`
    INSERT INTO kpi_trabalho (ano, mes, horas_homem, dias_perdidos)
    VALUES (${ano}, ${mes}, ${k.horas_homem}, ${k.dias_perdidos})
    ON CONFLICT (ano, mes) DO UPDATE
      SET horas_homem = EXCLUDED.horas_homem, dias_perdidos = EXCLUDED.dias_perdidos
  `;
}

export async function listarKpisAno(ano: number): Promise<(Kpi & { mes: number })[]> {
  return (await sql`
    SELECT mes, horas_homem, dias_perdidos FROM kpi_trabalho WHERE ano = ${ano}
  `) as (Kpi & { mes: number })[];
}

// ===== Consultas de apoio ao painel (TV) =====

export async function listarOcorrenciasAno(sistema: Sistema, ano: number): Promise<Ocorrencia[]> {
  return (await sql`
    SELECT ${COLUNAS} FROM ocorrencias
    WHERE sistema = ${sistema} AND ano = ${ano}
    ORDER BY mes, dia, id
  `) as Ocorrencia[];
}

// Todas as datas (distintas) que tiveram ocorrência — para a contagem de
// "dias consecutivos sem ocorrência" e o recorde.
export async function listarDatasOcorrencias(
  sistema: Sistema,
): Promise<{ ano: number; mes: number; dia: number }[]> {
  return (await sql`
    SELECT DISTINCT ano, mes, dia FROM ocorrencias WHERE sistema = ${sistema}
    ORDER BY ano, mes, dia
  `) as { ano: number; mes: number; dia: number }[];
}
