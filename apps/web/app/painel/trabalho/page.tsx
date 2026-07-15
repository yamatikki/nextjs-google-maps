import type { Metadata } from "next";
import { PainelCruz } from "../_shared/PainelCruz";

export const metadata: Metadata = {
  title: "Cruz Verde — Acidentes de Trabalho",
};

export default function PainelTrabalho() {
  return (
    <PainelCruz
      sistema="trabalho"
      titulo="ACIDENTES DE TRABALHO"
      labelRed="Acidentes c/ afast."
      labelYellow="Acidentes s/ afast."
      streakLabel="Dias consecutivos sem acidente de trabalho"
    />
  );
}
