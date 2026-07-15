import Link from "next/link";

export default function CipaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">CIPA</h1>
        <p className="text-lg text-gray-600">
          Comissão Interna de Prevenção de Acidentes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        <Link
          href="/cipa/work"
          className="group rounded-xl border border-green-200 bg-green-50 p-6 transition-colors hover:bg-green-100"
        >
          <div className="text-3xl mb-2">🦺</div>
          <h2 className="text-xl font-semibold mb-1">Acidentes de Trabalho</h2>
          <p className="text-gray-600 text-sm mb-4">
            Acompanhamento dos acidentes de trabalho dos colaboradores.
          </p>
          <span className="inline-flex items-center gap-1 font-medium text-green-700">
            Editar
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <Link
          href="/cipa/public"
          className="group rounded-xl border border-blue-200 bg-blue-50 p-6 transition-colors hover:bg-blue-100"
        >
          <div className="text-3xl mb-2">👥</div>
          <h2 className="text-xl font-semibold mb-1">Público Flutuante</h2>
          <p className="text-gray-600 text-sm mb-4">
            Acompanhamento de ocorrências com o público flutuante no campus.
          </p>
          <span className="inline-flex items-center gap-1 font-medium text-blue-700">
            Editar
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </div>

      {/* Painéis para exibição nas TVs (abrem em nova aba, tela cheia) */}
      <div className="flex flex-wrap justify-center gap-6 text-sm">
        <Link
          href="/painel/trabalho"
          target="_blank"
          className="font-medium text-green-700 hover:underline"
        >
          📺 Painel TV — Acidentes de Trabalho
        </Link>
        <Link
          href="/painel/publico"
          target="_blank"
          className="font-medium text-blue-700 hover:underline"
        >
          📺 Painel TV — Público Flutuante
        </Link>
      </div>
    </main>
  );
}
