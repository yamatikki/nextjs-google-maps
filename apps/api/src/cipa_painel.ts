// Montagem do "painel" (telas de TV): agrega as ocorrências + KPIs em um
// único pacote de dados, pronto para o front desenhar.
import {
  listarDatasOcorrencias,
  listarKpisAno,
  listarOcorrenciasAno,
  type Kpi,
  type Sistema,
} from "./cipa_db";

const HORAS_PADRAO = 109340; // horas-homem padrão quando o mês não foi preenchido
const INICIO = process.env.CRUZ_INICIO ?? "2026-01-01"; // início da contagem de dias

const pad = (n: number) => String(n).padStart(2, "0");
// Taxa de frequência/gravidade: casos por milhão de horas-homem (meta 0).
const taxa = (n: number, horas: number) => (horas ? +((n * 1_000_000) / horas).toFixed(2) : 0);

export type Contagem = {
  atual: number; // dias consecutivos sem ocorrência, terminando hoje
  recorde: number; // maior sequência desde o INICIO
  ultimo: string | null; // data da última ocorrência (AAAA-MM-DD)
  inicio: string;
};

// Anda dia a dia do INICIO até hoje: zera a sequência quando o dia teve
// ocorrência; senão soma 1 e atualiza o recorde. (Mesma regra do app antigo.)
async function calcularContagem(sistema: Sistema): Promise<Contagem> {
  const datas = await listarDatasOcorrencias(sistema);
  const marcados = new Set(datas.map((d) => `${d.ano}-${pad(d.mes)}-${pad(d.dia)}`));

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(`${INICIO}T00:00:00`);
  let atual = 0;
  let recorde = 0;
  let ultimo: string | null = null;

  while (d <= hoje) {
    const chave = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (marcados.has(chave)) {
      atual = 0;
      ultimo = chave;
    } else {
      atual++;
      if (atual > recorde) recorde = atual;
    }
    d.setDate(d.getDate() + 1);
  }
  return { atual, recorde, ultimo, inicio: INICIO };
}

export async function montarPainel(sistema: Sistema, ano: number, mes: number) {
  const [occAno, contagem] = await Promise.all([
    listarOcorrenciasAno(sistema, ano),
    calcularContagem(sistema),
  ]);
  const occMes = occAno.filter((o) => o.mes === mes);
  const base = { ano, mes, ocorrencias_mes: occMes, contagem };

  if (sistema === "trabalho") {
    // 12 meses de taxas (frequência c/ e s/ afastamento + gravidade).
    const kpis = await listarKpisAno(ano);
    const kpiDoMes = (m: number): Kpi =>
      kpis.find((k) => k.mes === m) ?? { horas_homem: 0, dias_perdidos: 0 };

    const kpi_ano = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const doMes = occAno.filter((o) => o.mes === m);
      const com = doMes.filter((o) => o.gravidade === "red").length;
      const sem = doMes.filter((o) => o.gravidade === "yellow").length;
      const k = kpiDoMes(m);
      const horas = k.horas_homem || HORAS_PADRAO;
      return {
        mes: m,
        com,
        sem,
        taxa_freq_com: taxa(com, horas),
        taxa_freq_sem: taxa(sem, horas),
        taxa_grav: taxa(k.dias_perdidos, horas),
      };
    });

    const k = kpiDoMes(mes);
    const horas = k.horas_homem || HORAS_PADRAO;
    const { com, sem } = kpi_ano[mes - 1];
    const kpi_mes = {
      horas_homem: k.horas_homem,
      dias_perdidos: k.dias_perdidos,
      acid_com: com,
      acid_sem: sem,
      total: com + sem,
      taxa_freq: taxa(com + sem, horas),
      taxa_freq_com: taxa(com, horas),
      taxa_freq_sem: taxa(sem, horas),
      taxa_grav: taxa(k.dias_perdidos, horas),
    };
    return { ...base, kpi_mes, kpi_ano };
  }

  // Público flutuante: contagens por categoria (ano em 12 posições + mês) e
  // resumo acidente × incidente do mês.
  const categorias_ano: Record<string, number[]> = {};
  for (const o of occAno) {
    const cat = o.categoria ?? "outros";
    (categorias_ano[cat] ??= Array(12).fill(0))[o.mes - 1]++;
  }
  const categorias_mes: Record<string, number> = {};
  const resumo_tipo = { acidente: 0, incidente: 0 };
  for (const o of occMes) {
    const cat = o.categoria ?? "outros";
    categorias_mes[cat] = (categorias_mes[cat] ?? 0) + 1;
    if (o.tipo === "acidente") resumo_tipo.acidente++;
    else resumo_tipo.incidente++;
  }
  return { ...base, categorias_ano, categorias_mes, resumo_tipo };
}
