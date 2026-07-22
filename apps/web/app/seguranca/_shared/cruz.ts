// Funções, constantes e tipos compartilhados pelas cruzes (Work e Public).
// A pasta com "_" na frente é PRIVADA: o Next NÃO cria rota a partir dela.

export type Gravidade = "red" | "yellow";
export type CorDia = "green" | "red" | "yellow" | "blank";

// A cruz só precisa saber o dia e a gravidade de cada ocorrência.
// Cada página pode ter campos a mais (categoria, tipo...) — não importam aqui.
export type OcorrenciaBase = { dia: number; gravidade: Gravidade };

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Classes Tailwind de cor de cada célula da cruz
export const COR_CELULA: Record<CorDia, string> = {
  green: "bg-green-700 text-green-100 border-green-900",
  red: "bg-red-600 text-white border-red-800",
  yellow: "bg-yellow-400 text-yellow-900 border-yellow-600",
  blank: "bg-gray-200 text-gray-400 border-gray-300",
};

// Quantos dias tem o mês (dia 0 do mês seguinte = último dia deste mês)
export function diasNoMes(ano: number, mes: number) {
  return new Date(ano, mes, 0).getDate();
}

// Monta o formato de CRUZ: lista para uma grade de 7 colunas; 0 = célula vazia.
// Braço de cima (colunas do meio) → faixa central larga → braço de baixo.
export function montarCruz(total: number): number[] {
  const cells: number[] = [];
  let d = 1;
  const add = (row: number[]) => cells.push(...row);

  for (let r = 0; r < 2; r++) {
    const row = [0, 0, 0, 0, 0, 0, 0];
    for (let c = 2; c <= 4; c++) if (d <= 6 && d <= total) row[c] = d++;
    add(row);
  }
  for (let r = 0; r < 3; r++) {
    const row = [0, 0, 0, 0, 0, 0, 0];
    for (let c = 0; c < 7; c++) if (d <= 27 && d <= total) row[c] = d++;
    add(row);
  }
  while (d <= total) {
    const row = [0, 0, 0, 0, 0, 0, 0];
    for (let c = 2; c <= 4; c++) if (d <= total) row[c] = d++;
    add(row);
  }
  return cells;
}

// Cor de um dia, DERIVADA das ocorrências daquele dia.
// red vence yellow; sem ocorrência: futuro = "blank", passado/hoje = "green".
export function corDoDia(
  ocorrenciasDoDia: OcorrenciaBase[],
  ano: number,
  mes: number,
  dia: number,
): CorDia {
  if (ocorrenciasDoDia.some((o) => o.gravidade === "red")) return "red";
  if (ocorrenciasDoDia.length) return "yellow";
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return data > hoje ? "blank" : "green";
}
