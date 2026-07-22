# Guia educativo — Next.js e a seção CIPA do SmartCampus

> Documento didático para entender **o que estamos construindo** e **como o Next.js
> funciona**. Escrito em linguagem simples, para quem está aprendendo.
> Local deste arquivo: `apps/web/app/cipa/GUIA-NEXTJS-CIPA.md`
> (é só um `.md` — o Next.js ignora; não vira página nem atrapalha o site).

## Índice
1. [O panorama: React, Next.js e por quê](#1-o-panorama)
2. [O formato deste projeto (monorepo)](#2-o-formato-deste-projeto)
3. [Roteamento: pastas viram endereços](#3-roteamento)
4. [Componentes e JSX](#4-componentes-e-jsx)
5. [Server Components vs Client Components](#5-server-vs-client)
6. [Layouts e `metadata`](#6-layouts-e-metadata)
7. [Navegação com `Link`](#7-navegação-com-link)
8. [Buscando dados (data fetching)](#8-buscando-dados)
9. [Estilo com Tailwind CSS](#9-estilo-com-tailwind)
10. [As páginas da CIPA explicadas](#10-as-páginas-da-cipa)
11. [Detalhes do Next.js 16 (pegadinhas)](#11-detalhes-do-next-16)
12. [Glossário rápido](#12-glossário)

---

## 1. O panorama
<a name="1-o-panorama"></a>

- **React** é uma biblioteca para construir **interfaces** (telas) montando "peças"
  reutilizáveis chamadas **componentes**. Cada componente é uma **função** que
  devolve algo parecido com HTML.
- **Next.js** é um **framework** construído em cima do React. Ele adiciona o que
  falta para fazer um site/app completo: sistema de **endereços (rotas)**,
  execução no **servidor**, otimização de imagens, build de produção, etc.
- **Por que usar Next em vez de React puro?** Porque ele já resolve roteamento,
  renderização no servidor (páginas mais rápidas e melhores para busca) e
  organização do projeto, sem você ter que montar tudo na mão.

Versões aqui: **Next.js 16.2**, **React 19**.

---

## 2. O formato deste projeto (monorepo)
<a name="2-o-formato-deste-projeto"></a>

O repositório é um **monorepo** (vários projetos relacionados na mesma pasta),
organizado com a ferramenta **Turborepo**:

```
nextjs-google-maps/
├── apps/
│   ├── web/   → o SITE (Next.js)   ← é aqui que trabalhamos
│   └── api/   → o SERVIDOR de dados (Bun + ElysiaJS, lê sensores, gera PDF)
└── packages/  → código compartilhado (ex.: @smartcampus/types)
```

- **`apps/web`** é a parte visual (front-end). Rotas atuais: `maps`, `reports` e a
  nossa nova `cipa`.
- **`apps/api`** é o back-end. Ele expõe dados em `http://localhost:3001` e o site
  consome esses dados.
- **Runtime:** o projeto roda com **Bun** (um substituto do Node.js). Pacotes do
  site: Next, React, Tailwind v4, shadcn/ui, Radix, lucide-react (ícones).

---

## 3. Roteamento: pastas viram endereços
<a name="3-roteamento"></a>

Esta versão do Next usa o **"App Router"**. A regra de ouro:

> **A estrutura de pastas dentro de `app/` É o mapa de URLs do site.**
> Uma pasta com um arquivo `page.tsx` vira uma página acessível.

Arquivos com **nomes especiais** dentro de uma pasta de rota:

| Arquivo | Para que serve |
|---|---|
| `page.tsx` | O conteúdo daquela URL (a página em si). |
| `layout.tsx` | Uma "moldura" que envolve a página e suas subpáginas. |
| `loading.tsx` | Tela de carregamento (opcional). |
| `error.tsx` | Tela de erro (opcional). |

Exemplo com a nossa CIPA:

```
app/cipa/
├── layout.tsx        →  envolve tudo que começa com /cipa
├── page.tsx          →  URL:  /cipa
├── work/page.tsx     →  URL:  /cipa/work
└── public/page.tsx   →  URL:  /cipa/public
```

Ou seja: **criar a pasta `work/` com um `page.tsx` já cria o endereço
`/cipa/work`** — não precisa "registrar" rota em lugar nenhum.

---

## 4. Componentes e JSX
<a name="4-componentes-e-jsx"></a>

Um **componente** é uma função que devolve **JSX**. JSX é uma sintaxe que parece
HTML, mas vive dentro do código:

```tsx
export default function CipaPage() {
  return (
    <main>
      <h1>CIPA</h1>
    </main>
  );
}
```

Pontos de atenção do JSX (diferenças do HTML puro):
- Usa-se **`className`** no lugar de `class`.
- Para inserir **código/variáveis** no meio do JSX, use **chaves `{ }}`**:
  `{children}`, `{sensor.name}`.
- `export default` marca o **item principal** do arquivo (a página/componente que
  o Next vai usar).

---

## 5. Server Components vs Client Components
<a name="5-server-vs-client"></a>

**O conceito mais importante do Next moderno.** Todo componente roda em um de dois
lugares:

### Server Component (é o padrão)
- Roda **no servidor**, antes de chegar ao navegador. Entrega HTML pronto.
- **Pode:** acessar banco de dados, ler arquivos, usar segredos (chaves de API),
  e fazer `await fetch(...)` direto.
- **Não pode:** interatividade de navegador — nada de `useState`, `onClick`,
  `useEffect`, `window`, `localStorage`.
- As **4 páginas da CIPA são Server Components** (nenhuma tem `"use client"`).

### Client Component
- Criado colocando **`"use client"`** na **primeira linha** do arquivo.
- Roda **no navegador** do usuário.
- **Pode:** ser interativo — `useState`, `onClick`, `useEffect`, etc.
- Exemplo: o antigo `PDFGenerator.tsx` era Client (`"use client"`) porque tinha
  botão com `onClick`, guardava a data com `useState` e usava `useEffect`.

### Por que existe essa divisão?
1. **Velocidade** — quanto mais o servidor entrega pronto, menos JavaScript o
   navegador baixa → site abre mais rápido.
2. **Segurança** — segredos ficam só no servidor; um Client Component vai inteiro
   para o navegador, então nunca deve conter senha/chave.

### Regra prática
> Comece sempre com **Server Component**. Só use `"use client"` **quando precisar
> de interação**, e apenas no **pedaço interativo** (não na página toda).

Quando criarmos os **formulários** de registro de acidentes, aí usaremos Client
Components.

---

## 6. Layouts e `metadata`
<a name="6-layouts-e-metadata"></a>

Um **`layout.tsx`** é uma moldura compartilhada. Ele recebe um `children`
(o conteúdo da página atual) e o coloca dentro de uma estrutura comum:

```tsx
export default function CipaLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col h-screen">{children}</div>;
}
```

- **`children`** = "a página que está sendo aberta agora". O layout desenha em
  volta e injeta a página ali.
- Layouts **não recarregam** ao navegar entre subpáginas — só o `children` troca.
  Ótimo para menus/cabeçalhos fixos (que ainda podemos adicionar à CIPA).

**`metadata`** são as informações da aba do navegador:

```tsx
export const metadata: Metadata = {
  title: "CIPA | SmartCampus Mauá",
  description: "Comissão Interna de Prevenção de Acidentes",
};
```

O Next lê esse objeto automaticamente e coloca o `title` na aba.

---

## 7. Navegação com `Link`
<a name="7-navegação-com-link"></a>

Para ir de uma página a outra **dentro do site**, usamos o componente `Link` do
Next (em vez do `<a>` comum):

```tsx
import Link from "next/link";

<Link href="/cipa/work">Acidentes de Trabalho</Link>
```

Vantagem: o `Link` troca de página **sem recarregar o site inteiro** (navegação
instantânea) e ainda pré-carrega a página de destino. Use `<a>` apenas para links
**externos** (outros sites).

---

## 8. Buscando dados (data fetching)
<a name="8-buscando-dados"></a>

Como as páginas (Server Components) rodam no servidor, elas podem buscar dados
**direto**, com `await`. Neste projeto, as funções de busca ficam em
`apps/web/lib/api.ts`. Exemplo real:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchRestaurants(): Promise<SensorsResponse> {
  const res = await fetch(`${API_URL}/restaurant/sensors`, {
    next: { revalidate: 30 }, // guarda o resultado por 30s antes de buscar de novo
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return res.json();
}
```

E uma página usa assim:

```tsx
export default async function Page() {        // repare no "async"
  const dados = (await fetchRestaurants()).data;
  return <div>{/* ...usa os dados... */}</div>;
}
```

- Como o `fetch` acontece **no servidor**, **não há problema de CORS** (aquele erro
  de "site A não pode chamar site B" que ocorre no navegador).
- **`next: { revalidate: 30 }`** controla o cache: reaproveita a resposta por 30
  segundos. (Sem isso, no Next 16 o `fetch` **não** guarda cache por padrão.)
- Nossas páginas de CIPA **ainda não buscam dados** — são só layout. Quando
  formos plugar dados reais, seguiremos esse mesmo padrão.

---

## 9. Estilo com Tailwind CSS
<a name="9-estilo-com-tailwind"></a>

**Tailwind** é "utility-first": em vez de escrever CSS num arquivo separado, você
monta o visual juntando classinhas prontas direto no elemento. Cada classe = uma
regrinha de CSS:

| Classe | Significado |
|---|---|
| `flex` / `flex-col` | layout flexível / em coluna |
| `items-center` / `justify-center` | centraliza na horizontal / vertical |
| `p-8` | espaço interno de 32px (padding) |
| `gap-6` | 24px de espaço entre os filhos |
| `mb-2` | margem inferior de 8px |
| `text-4xl` / `font-bold` | fonte grande / negrito |
| `text-gray-600` | cor cinza médio |
| `rounded-xl` / `border` | cantos arredondados / borda |
| `bg-green-50` | fundo verde bem claro |

**Escala:** os números são múltiplos de **4px** (`p-8` = 8×4 = 32px).

**Prefixos (quando aplicar):**
- `hover:bg-green-100` → muda só **ao passar o mouse**.
- `sm:grid-cols-2` → 2 colunas só **em telas ≥ pequenas** (responsividade).
- `group-hover:translate-x-1` → aplica quando o **card pai** (marcado `group`) está
  sob o mouse — por isso a setinha desliza.

**Como está montado neste projeto (Tailwind v4 + shadcn):**
- O `app/globals.css` liga o Tailwind com uma linha: `@import "tailwindcss";`.
- Ele define **cores nomeadas** em `:root` (tema claro) e `.dark` (tema escuro) —
  ex. `--primary`, `--card`, `--border`. Daí vêm classes como `bg-background` e
  `text-foreground`, que trocam sozinhas no modo escuro. As cores usam `oklch()`.
- **shadcn/ui** (em `components/ui/`) são componentes prontos (botão, calendário,
  popover) feitos sobre **Radix** + Tailwind, com o código dentro do próprio
  projeto (você pode editar).

---

## 10. As páginas da CIPA explicadas
<a name="10-as-páginas-da-cipa"></a>

### `cipa/page.tsx` — página inicial (`/cipa`)
Server Component. Mostra um cabeçalho ("CIPA" + subtítulo) e uma **grade com 2
cards**, cada um sendo um `Link`:
- Card verde 🦺 → `/cipa/work` (Acidentes de Trabalho)
- Card azul 👥 → `/cipa/public` (Público Flutuante)

Detalhes visuais: grade responsiva (`grid-cols-1 sm:grid-cols-2`), efeito de hover
no card (`hover:bg-...`) e a setinha que desliza (`group` + `group-hover`).

### `cipa/work/page.tsx` e `cipa/public/page.tsx`
Server Components simples (por enquanto, placeholders "Em construção"). Cada uma
tem um título e um `Link` "← Voltar para a CIPA" apontando para `/cipa`,
fechando o ciclo de navegação.

### `cipa/layout.tsx`
A moldura de toda a seção `/cipa`. Define o `metadata` (título da aba
"CIPA | SmartCampus Mauá") e envolve o conteúdo num `<div>` que ocupa a altura
da tela.

### Fluxo de navegação
```
        /cipa  (page.tsx)
        ┌──────────────┐
        │  🦺 card  ────┼──► /cipa/work   ──┐
        │  👥 card  ────┼──► /cipa/public ──┤
        └──────────────┘                   │
              ▲                             │
              └──── "← Voltar" ─────────────┘
```

---

## 11. Detalhes do Next.js 16 (pegadinhas)
<a name="11-detalhes-do-next-16"></a>

Coisas específicas desta versão, boas de saber:
- **Server Component é o padrão**; adicione `"use client"` para interatividade.
- **`fetch` não tem cache por padrão** — use `next: { revalidate: N }` ou
  `cache: "force-cache"` quando quiser reaproveitar respostas.
- **`params` e `searchParams` são "Promises"** — em páginas que recebem parâmetros
  da URL, é preciso usar `await` neles.
- O antigo **"middleware" virou "Proxy"** (`proxy.ts`) — interceptação de
  requisições, caso precisemos no futuro.

---

## 12. Glossário rápido
<a name="12-glossário"></a>

- **Componente** — função que devolve JSX (um pedaço de tela).
- **JSX** — sintaxe parecida com HTML, escrita dentro do código.
- **Rota / Route** — um endereço (URL) do site.
- **App Router** — o sistema do Next em que pastas viram rotas.
- **Server Component** — roda no servidor; entrega HTML pronto; sem interação.
- **Client Component** — `"use client"`; roda no navegador; permite interação.
- **Props** — os "parâmetros" que um componente recebe (ex.: `children`, `sensor`).
- **`children`** — conteúdo passado para dentro de um componente (usado em layouts).
- **Hook** — funções do React que começam com `use` (`useState`, `useEffect`...).
- **Tailwind** — CSS por classes utilitárias prontas.
- **Monorepo** — vários projetos relacionados no mesmo repositório.
- **Bun** — runtime (executa o JavaScript/TypeScript); aqui substitui o Node.js.
- **CORS** — regra de segurança do navegador entre sites diferentes; evitada
  quando buscamos dados no servidor.

---

*Próximos passos sugeridos (quando você quiser): adicionar um cabeçalho/menu fixo
à seção CIPA via `layout.tsx`, e depois transformar `work` e `public` em páginas
com conteúdo real (provavelmente já com formulários — aí entram os Client
Components).*
