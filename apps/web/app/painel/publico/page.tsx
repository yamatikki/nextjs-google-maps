import type { Metadata } from "next";
import { PainelCruz } from "../_shared/PainelCruz";

export const metadata: Metadata = {
  title: "Cruz Verde — Público Flutuante",
};

export default function PainelPublico() {
  return (
    <PainelCruz
      sistema="publico"
      titulo="PÚBLICO FLUTUANTE"
      labelRed="Ocorrências graves"
      labelYellow="Ocorrências leves"
      streakLabel="Dias consecutivos sem ocorrência"
    />
  );
}
