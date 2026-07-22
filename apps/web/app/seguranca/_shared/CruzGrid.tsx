"use client";

import { COR_CELULA, corDoDia, diasNoMes, montarCruz, type OcorrenciaBase } from "./cruz";

// A cruz interativa, compartilhada por Work e Public.
// Recebe as ocorrências DO MÊS (só precisa de dia + gravidade) e avisa o pai,
// via onDiaClick, quando um dia é clicado. Campos extras (categoria, tipo...)
// existem nas ocorrências de cada página, mas aqui são simplesmente ignorados.
export function CruzGrid({
  ano,
  mes,
  ocorrenciasMes,
  onDiaClick,
}: {
  ano: number;
  mes: number;
  ocorrenciasMes: OcorrenciaBase[];
  onDiaClick: (dia: number) => void;
}) {
  const celulas = montarCruz(diasNoMes(ano, mes));

  return (
    <div className="mx-auto grid w-max grid-cols-7 gap-1.5 rounded-lg border-2 border-green-200 bg-green-50 p-3">
      {celulas.map((dia, i) => {
        if (dia === 0) return <div key={i} className="h-11 w-11" />;
        const doDia = ocorrenciasMes.filter((o) => o.dia === dia);
        const cor = corDoDia(doDia, ano, mes, dia);
        return (
          <button
            key={i}
            onClick={() => onDiaClick(dia)}
            className={`relative flex h-11 w-11 items-center justify-center rounded border-2 font-semibold transition-transform hover:scale-110 ${COR_CELULA[cor]}`}
          >
            {dia}
            {doDia.length > 1 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white">
                {doDia.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
