# Memory Paging — Simulador de Hardware de Paginação

Simulador web interativo e didático que representa visualmente a tradução de endereços em sistemas de memória virtual com paginação. Projeto da disciplina de Sistemas Operacionais (IFSC, Tecnologia em ADS).

A entrega é dividida em duas partes:

- **Parte 1** — Tradução de endereços com tabelas válidas, 3 processos (P1/P2/P3), 16 quadros de 1 KiB, PTBR por processo, painéis de visualização (Processos/TCB · MMU · RAM).
- **Parte 2** — Page fault, alocação sob demanda, swap, substituição manual de páginas, violação de proteção (frame 1 = kernel).

A especificação canônica está em `MiniProjetoHardwareMemoriaVirtual (2).pdf` na raiz. Em qualquer divergência, o PDF vence.

---

## Stack

| Camada | Ferramenta | Notas |
|---|---|---|
| Package manager / runner | **Bun** | `bun install`, `bun dev`, `bun test`, `bun run build` |
| Build / dev server | **Vite** | Executado via `bun` |
| Linguagem | **TypeScript** | `strict: true`, `noUncheckedIndexedAccess: true` |
| UI | **React 19** | Function components, sem class components |
| Styling | **TailwindCSS v4** | Configuração via `@theme` em CSS, sem `tailwind.config.js` |
| Design system | **Skeleton v3** (`@skeletonlabs/skeleton`) | Tema preset `hamlindigo` (light) |
| Estado global | **Zustand** | Um único store: `useSimulatorStore` |
| Animações | **Framer Motion** (`motion/react`) | Piscar quadros, sequência de passos da MMU |
| Testes | **Vitest** + **@testing-library/react** | `bun run test` |
| Lint / Format | **Biome** | `biome check`, `biome format` |

### Comandos canônicos

```sh
bun install              # instala deps
bun dev                  # dev server (Vite)
bun run build            # build de produção
bun run test             # vitest
bun run check            # biome check (lint + format check)
bun run format           # biome format --write
```

---

## Estrutura de pastas

```
src/
├── main.tsx                 # entrypoint
├── App.tsx                  # layout dos 3 painéis
├── app.css                  # tailwind + skeleton + tema hamlindigo
│
├── domain/                  # lógica pura, ZERO React/Zustand/DOM
│   ├── types.ts             # Processo, PageTableEntry, Frame, addresses
│   ├── constants.ts         # PAGE_SIZE, RAM_FRAMES, etc.
│   ├── address.ts           # decompor endereço lógico
│   ├── mmu.ts               # tradução: PTBR → tabela → quadro → físico
│   └── initialState.ts      # configuração inicial dos 3 processos
│
├── store/
│   └── simulator.ts         # store Zustand (estado + ações)
│
├── components/
│   ├── ProcessPanel.tsx     # painel esquerdo (P1/P2/P3 + TCB)
│   ├── MMUPanel.tsx         # painel central (passos da tradução)
│   ├── RAMPanel.tsx         # painel direito (16 quadros coloridos)
│   ├── Frame.tsx            # célula de um quadro
│   └── VariableButton.tsx   # botão de variável (gatilha tradução)
│
└── lib/
    └── colors.ts            # mapa processo → cor (tokens Skeleton)
```

**Regra de ouro:** `domain/` não importa nada de React, Zustand, ou DOM. Tudo testável isoladamente.

---

## Code style

- Functions: 4–20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`. Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.

### Naming específico do projeto

- Componentes React: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Funções de domínio: nomes técnicos em pt-BR são aceitáveis (`traduzirEndereco`, `decomporEndereco`, `consultarTabelaPaginas`) — projeto é didático em pt-BR
- Tipos / Interfaces: `PascalCase` em inglês curto (`Process`, `PageTableEntry`, `Frame`, `PhysicalAddress`)
- Constantes: `SCREAMING_SNAKE_CASE` (`PAGE_SIZE`, `RAM_FRAMES`)

### TypeScript

- Sem `any`. Quando inevitável, `unknown` + narrowing.
- Endereços e índices têm tipos distintos (branded types ou pelo menos aliases nomeados): `PageNumber`, `FrameNumber`, `LogicalAddress`, `PhysicalAddress`, `Offset`.
- Tipos exportados de `src/domain/types.ts`. Sem prefixos `I` ou `T`.

### React

- `export function Nome()` — sem `default export` (exceto `App.tsx`).
- Props inline ou `type Props = { ... }` no topo do arquivo.
- Evitar `useEffect` para lógica derivada — usar selectors do store.
- Sem prop drilling: ao chegar em 3+ níveis, mover para o store.

### Domain (lógica pura)

- Sem imports de React, Zustand ou DOM.
- Funções puras: mesma entrada → mesma saída.
- Imutabilidade: nunca mutar parâmetros; retornar novos objetos.
- Toda função de tradução / decomposição tem teste unitário.

### Store (Zustand)

- Um único store: `useSimulatorStore`.
- Ações explícitas: `selecionarProcesso`, `acessarVariavel`, `resetarSimulacao`.
- Selectors granulares no componente: `useSimulatorStore(s => s.processoAtivo)`. Nunca desestruturar o store inteiro.

### Styling

- Classes Tailwind direto no JSX.
- Preferir tokens Skeleton (`bg-surface-100`, `text-primary-500`) a cores cruas.
- Cores por processo definidas uma única vez em `lib/colors.ts`.

---

## Comments

- Keep your own comments. Don't strip them on refactor — they carry intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers / commit SHAs when a line exists because of a specific bug or upstream constraint.

---

## Tests

- Tests run with a single command: `bun run test`.
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs.
- Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely.
- Fixtures de tradução devem cobrir os casos do PDF (P1 PTBR `0x0000` com páginas 5/8/9/11, etc.).

---

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin interface owned by this project.
- Não adicionar nova dependência sem necessidade clara. Justificar no commit.

---

## Structure

- Follow the framework's convention (Vite/React).
- Prefer small focused modules over god files.
- Predictable paths: `domain/`, `components/`, `store/`, `lib/`.

---

## Formatting

- Use the language default formatter: `biome format`. Don't discuss style beyond that.
- Não brigar com o Biome. Se ele formatar de um jeito, é o jeito.

---

## Logging

- Structured JSON when logging for debugging / observability.
- Plain text only for user-facing CLI output.
- No browser, logs de debug vão para `console.debug` com objetos estruturados (`console.debug({ event: 'translate', processo, pagina, quadro })`), não strings concatenadas.

---

## Commits

- **Atômicos** — uma mudança lógica por commit.
- **Inglês** — mensagem em inglês, mesmo com termos pt-BR no código.
- **Conventional Commits sem parênteses** — `feat: add MMU panel`, NÃO `feat(mmu): add MMU panel`.
- Prefixos válidos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`.
- **Sem trailer `Co-Authored-By`.**

Exemplos válidos:

```
feat: add address decomposition to domain
fix: correct PTBR offset lookup in MMU
test: add fixtures for P2 page table
refactor: extract frame color mapping to lib
docs: document Part 1 scope in README
```

---

## Boas práticas específicas do simulador

1. **Endereços vs. índices têm tipos distintos** — branded types ou aliases nomeados. Nunca passar um `FrameNumber` onde um `PageNumber` é esperado.
2. **Constantes nomeadas, não mágicas**:
   ```ts
   export const PAGE_SIZE = 1024;             // bytes
   export const RAM_FRAMES = 16;              // quadros 0..15
   export const PAGES_PER_PROCESS = 4;
   export const FRAME_PAGE_TABLES = 0;        // quadro reservado
   ```
3. **`traduzirEndereco` retorna passos, não só o resultado.** A MMU consome um array `Step[]` para animar a tradução (decomposição → leitura do PTBR → consulta da entrada → cálculo do endereço físico).
4. **Quadro 0 reservado para tabelas de página.** Validar em todo ponto de escrita; quadro 1 será o kernel na Parte 2 (violação de proteção).
5. **Cores por processo fixas e únicas** em `lib/colors.ts`. P1, P2, P3 mapeiam para tokens do tema `hamlindigo`.
6. **Sem persistência na Parte 1.** Estado vive em memória; `resetarSimulacao` volta à configuração inicial do PDF.
7. **Animação de "piscar"** no quadro acessado: `motion/react` com `animate-pulse` ou variants próprios. Duração curta (~600ms), 2 ciclos.
8. **Configuração inicial** (do PDF, fixa):

   | Processo | PTBR Offset | Pág 0 | Pág 1 | Pág 2 | Pág 3 |
   |---|---|---|---|---|---|
   | P1 | `0x0000` | 5 | 8 | 9 | 11 |
   | P2 | `0x0100` | 1 | 2 | 12 | 13 |
   | P3 | `0x0200` | 3 | 4 | 14 | 15 |

---

## Escopo da Parte 1 (atual)

Implementar:

- 3 processos com tabelas de página válidas pré-configuradas.
- PTBR por processo (offset dentro do frame 0, armazenado no TCB).
- 4 variáveis por processo, cada uma em uma página diferente.
- Clique em variável → MMU executa tradução visível passo a passo → quadro alvo pisca na RAM.
- Painel esquerdo: lista de processos + TCB (com PTBR de cada).
- Painel central: MMU com decomposição do endereço, consulta à tabela, cálculo do endereço físico.
- Painel direito: RAM colorida por processo (16 quadros, quadro 0 destacado como "tabelas").

**Fora do escopo da Parte 1** (deixar para Parte 2): page fault, swap, alocação sob demanda, frame de kernel, substituição manual.
