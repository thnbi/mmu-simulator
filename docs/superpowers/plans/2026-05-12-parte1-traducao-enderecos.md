# Parte 1 — Tradução de Endereços (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive web simulator showing logical-to-physical address translation for 3 processes sharing 16 frames of 1 KiB RAM, with visible MMU steps and animated frame access.

**Architecture:** Pure-TS `domain/` layer (address math, MMU translation) consumed by a single Zustand store, rendered as three React panels (Processes/TCB · MMU · RAM) with Framer Motion animations. Domain is fully unit-tested before any UI exists.

**Tech Stack:** Bun · Vite · React 19 · TypeScript (strict) · TailwindCSS v4 · Skeleton v3 (theme `hamlindigo`) · Zustand · Framer Motion · Vitest · Testing Library · Biome.

**Reference:** `MiniProjetoHardwareMemoriaVirtual (2).pdf` (spec) and `CLAUDE.md` (conventions). Initial process configuration table is in CLAUDE.md.

---

## File map

Will create:
- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `biome.json`, `index.html`, `.gitignore`
- `src/main.tsx`, `src/App.tsx`, `src/app.css`
- `src/domain/types.ts`, `src/domain/constants.ts`, `src/domain/address.ts`, `src/domain/mmu.ts`, `src/domain/initialState.ts`
- `src/domain/address.test.ts`, `src/domain/mmu.test.ts`
- `src/store/simulator.ts`, `src/store/simulator.test.ts`
- `src/lib/colors.ts`
- `src/components/ProcessPanel.tsx`, `src/components/MMUPanel.tsx`, `src/components/RAMPanel.tsx`, `src/components/Frame.tsx`, `src/components/VariableButton.tsx`
- `src/test/setup.ts`

---

## Task 1 — Project bootstrap (Vite + React + TS + Bun)

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Init git and scaffold Vite project with Bun**

Run:
```bash
cd /home/rfreitas/dev/ifsc/memory-paging
git init
bun create vite@latest . --template react-ts
```

When prompted about non-empty dir, choose "Ignore files and continue".

- [ ] **Step 2: Install deps**

Run:
```bash
bun install
```

Expected: `node_modules/` populated, `bun.lockb` created.

- [ ] **Step 3: Verify dev server boots**

Run:
```bash
bun dev
```

Expected: Vite prints `Local: http://localhost:5173/`. Kill it with Ctrl+C.

- [ ] **Step 4: Replace `.gitignore` with project-wide rules**

Create `.gitignore`:
```
node_modules/
dist/
.vite/
*.log
.env
.env.local
.DS_Store
coverage/
```

- [ ] **Step 5: First commit**

```bash
git add .
git commit -m "chore: scaffold vite react-ts project"
```

---

## Task 2 — Install simulator dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add runtime deps**

Run:
```bash
bun add zustand motion @skeletonlabs/skeleton @skeletonlabs/skeleton-react
```

- [ ] **Step 2: Add tailwind v4 and skeleton-required plugins**

Run:
```bash
bun add -d tailwindcss @tailwindcss/vite @tailwindcss/forms
```

- [ ] **Step 3: Add test and lint tooling**

Run:
```bash
bun add -d vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @biomejs/biome
```

- [ ] **Step 4: Verify install**

Run:
```bash
bun pm ls
```

Expected: all packages listed above appear, no peer warnings about React.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add zustand motion skeleton tailwind vitest biome"
```

---

## Task 3 — Configure Tailwind v4 + Skeleton + theme `hamlindigo`

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `src/app.css`
- Delete: `src/App.css`, `src/index.css` (Vite template defaults)

- [ ] **Step 1: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 2: Remove template CSS files**

Run:
```bash
rm -f src/App.css src/index.css
```

- [ ] **Step 3: Create `src/app.css`**

```css
@import 'tailwindcss';
@import '@skeletonlabs/skeleton';
@import '@skeletonlabs/skeleton/optional/presets';
@import '@skeletonlabs/skeleton/themes/hamlindigo';

@source '../node_modules/@skeletonlabs/skeleton-react/dist';
```

- [ ] **Step 4: Update `index.html` to set theme on `<body>`**

Replace the `<body>` opening tag with:
```html
<body data-theme="hamlindigo">
```

Also update `<title>` to:
```html
<title>Simulador de Paginação — Parte 1</title>
```

- [ ] **Step 5: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Replace `src/App.tsx` with placeholder**

```tsx
export function App() {
  return (
    <main className="min-h-screen bg-surface-50-950 p-6 text-surface-contrast-50-950">
      <h1 className="h1">Simulador de Paginação</h1>
      <p className="mt-2 text-surface-700-300">Parte 1 — Tradução de Endereços</p>
    </main>
  );
}
```

- [ ] **Step 7: Boot and verify theme is applied**

Run:
```bash
bun dev
```

Open `http://localhost:5173/`. Expected: heading rendered with the `hamlindigo` palette (indigo primary, neutral surface). Kill with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add vite.config.ts index.html src/app.css src/main.tsx src/App.tsx
git rm src/App.css src/index.css 2>/dev/null || true
git commit -m "feat: wire tailwind v4 and skeleton hamlindigo theme"
```

---

## Task 4 — Configure Biome

**Files:**
- Create: `biome.json`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignore": ["dist", "node_modules", "coverage"]
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

- [ ] **Step 2: Add scripts to `package.json`**

Inside `"scripts"`, replace the section so it includes:
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "check": "biome check .",
  "format": "biome format --write .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Run check (expect existing template files to be reformatted)**

Run:
```bash
bun run format
bun run check
```

Expected: `check` exits 0 after `format`.

- [ ] **Step 4: Commit**

```bash
git add biome.json package.json src
git commit -m "chore: configure biome lint and format"
```

---

## Task 5 — Configure Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`, `tsconfig.json` (update)

- [ ] **Step 1: Update `vite.config.ts` to add vitest config**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

This file is consumed by both Vite and Vitest. The `test` block is ignored by Vite at build time.

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add `"types": ["vitest/globals"]` to `tsconfig.json`**

Open `tsconfig.json` (or `tsconfig.app.json` depending on Vite template) and inside `compilerOptions` add:
```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

If `compilerOptions.strict` is missing, also add:
```json
"strict": true,
"noUncheckedIndexedAccess": true
```

- [ ] **Step 4: Verify tests run (zero tests, but config loads)**

Run:
```bash
bun run test
```

Expected: `No test files found, exiting with code 0` or similar message — exit code 0.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/test/setup.ts tsconfig.json tsconfig.app.json 2>/dev/null || true
git commit -m "chore: configure vitest with jsdom and testing-library"
```

---

## Task 6 — Domain types

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: Write `src/domain/types.ts`**

```ts
export type ProcessId = 'P1' | 'P2' | 'P3';

export type PageNumber = number & { readonly __brand: 'PageNumber' };
export type FrameNumber = number & { readonly __brand: 'FrameNumber' };
export type Offset = number & { readonly __brand: 'Offset' };
export type LogicalAddress = number & { readonly __brand: 'LogicalAddress' };
export type PhysicalAddress = number & { readonly __brand: 'PhysicalAddress' };

export const asPage = (n: number): PageNumber => n as PageNumber;
export const asFrame = (n: number): FrameNumber => n as FrameNumber;
export const asOffset = (n: number): Offset => n as Offset;
export const asLogical = (n: number): LogicalAddress => n as LogicalAddress;
export const asPhysical = (n: number): PhysicalAddress => n as PhysicalAddress;

export type PageTableEntry = {
  page: PageNumber;
  frame: FrameNumber;
};

export type Process = {
  id: ProcessId;
  ptbrOffset: number;
  pageTable: PageTableEntry[];
  variables: LogicalAddress[];
};

export type TranslationStep =
  | { kind: 'decompose'; logical: LogicalAddress; page: PageNumber; offset: Offset }
  | { kind: 'read-ptbr'; processId: ProcessId; ptbrOffset: number }
  | { kind: 'lookup-entry'; page: PageNumber; frame: FrameNumber }
  | { kind: 'compute-physical'; frame: FrameNumber; offset: Offset; physical: PhysicalAddress };

export type Translation = {
  logical: LogicalAddress;
  physical: PhysicalAddress;
  frame: FrameNumber;
  steps: TranslationStep[];
};
```

- [ ] **Step 2: Run check**

Run:
```bash
bun run check
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat: add domain types with branded numeric aliases"
```

---

## Task 7 — Domain constants

**Files:**
- Create: `src/domain/constants.ts`

- [ ] **Step 1: Write `src/domain/constants.ts`**

```ts
export const PAGE_SIZE = 1024;
export const RAM_FRAMES = 16;
export const PAGES_PER_PROCESS = 4;
export const FRAME_PAGE_TABLES = 0;
export const VIRTUAL_ADDRESS_SPACE = PAGE_SIZE * PAGES_PER_PROCESS;
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/constants.ts
git commit -m "feat: add domain constants"
```

---

## Task 8 — Address decomposition (TDD)

**Files:**
- Create: `src/domain/address.ts`, `src/domain/address.test.ts`

- [ ] **Step 1: Write failing test `src/domain/address.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { decomporEndereco } from './address';
import { asLogical } from './types';

describe('decomporEndereco', () => {
  it('decomposes 0x0000 into page 0 offset 0', () => {
    const r = decomporEndereco(asLogical(0x0000));
    expect(r.page).toBe(0);
    expect(r.offset).toBe(0);
  });

  it('decomposes 0x0400 into page 1 offset 0', () => {
    const r = decomporEndereco(asLogical(0x0400));
    expect(r.page).toBe(1);
    expect(r.offset).toBe(0);
  });

  it('decomposes 0x0CFF into page 3 offset 255', () => {
    const r = decomporEndereco(asLogical(0x0CFF));
    expect(r.page).toBe(3);
    expect(r.offset).toBe(0xFF);
  });

  it('throws on address >= virtual address space', () => {
    expect(() => decomporEndereco(asLogical(0x1000))).toThrow(/4096/);
  });

  it('throws on negative address', () => {
    expect(() => decomporEndereco(asLogical(-1))).toThrow(/-1/);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run:
```bash
bun run test src/domain/address.test.ts
```

Expected: FAIL, "Failed to resolve import './address'".

- [ ] **Step 3: Implement `src/domain/address.ts`**

```ts
import { PAGE_SIZE, VIRTUAL_ADDRESS_SPACE } from './constants';
import { type LogicalAddress, asOffset, asPage, type Offset, type PageNumber } from './types';

export function decomporEndereco(logical: LogicalAddress): { page: PageNumber; offset: Offset } {
  if (logical < 0 || logical >= VIRTUAL_ADDRESS_SPACE) {
    throw new RangeError(
      `Endereço lógico fora do espaço virtual: recebi ${logical}, esperado 0..${VIRTUAL_ADDRESS_SPACE - 1}`,
    );
  }
  const page = asPage(Math.floor(logical / PAGE_SIZE));
  const offset = asOffset(logical % PAGE_SIZE);
  return { page, offset };
}
```

- [ ] **Step 4: Run test, expect PASS**

Run:
```bash
bun run test src/domain/address.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/address.ts src/domain/address.test.ts
git commit -m "feat: add logical address decomposition"
```

---

## Task 9 — MMU translation (TDD)

**Files:**
- Create: `src/domain/mmu.ts`, `src/domain/mmu.test.ts`

- [ ] **Step 1: Write failing test `src/domain/mmu.test.ts`**

Uses fixtures from CLAUDE.md (P1 PTBR `0x0000`, pages 5/8/9/11).

```ts
import { describe, expect, it } from 'vitest';
import { traduzirEndereco } from './mmu';
import { asFrame, asLogical, asPage, type Process } from './types';

const p1: Process = {
  id: 'P1',
  ptbrOffset: 0x0000,
  pageTable: [
    { page: asPage(0), frame: asFrame(5) },
    { page: asPage(1), frame: asFrame(8) },
    { page: asPage(2), frame: asFrame(9) },
    { page: asPage(3), frame: asFrame(11) },
  ],
  variables: [asLogical(0x0000), asLogical(0x0400), asLogical(0x0800), asLogical(0x0C00)],
};

describe('traduzirEndereco', () => {
  it('translates P1 variable on page 0 to frame 5', () => {
    const t = traduzirEndereco(p1, asLogical(0x0000));
    expect(t.frame).toBe(5);
    expect(t.physical).toBe(5 * 1024 + 0);
  });

  it('translates P1 variable on page 3 to frame 11', () => {
    const t = traduzirEndereco(p1, asLogical(0x0C00));
    expect(t.frame).toBe(11);
    expect(t.physical).toBe(11 * 1024);
  });

  it('returns 4 steps in order: decompose, read-ptbr, lookup-entry, compute-physical', () => {
    const t = traduzirEndereco(p1, asLogical(0x0400));
    expect(t.steps.map((s) => s.kind)).toEqual([
      'decompose',
      'read-ptbr',
      'lookup-entry',
      'compute-physical',
    ]);
  });

  it('throws when page is not in process page table', () => {
    const broken: Process = { ...p1, pageTable: [] };
    expect(() => traduzirEndereco(broken, asLogical(0x0000))).toThrow(/página 0/i);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run:
```bash
bun run test src/domain/mmu.test.ts
```

Expected: FAIL, missing module.

- [ ] **Step 3: Implement `src/domain/mmu.ts`**

```ts
import { decomporEndereco } from './address';
import { PAGE_SIZE } from './constants';
import {
  asPhysical,
  type LogicalAddress,
  type PageNumber,
  type Process,
  type Translation,
  type TranslationStep,
} from './types';

export function traduzirEndereco(processo: Process, logical: LogicalAddress): Translation {
  const { page, offset } = decomporEndereco(logical);
  const entry = processo.pageTable.find((e) => e.page === page);
  if (!entry) {
    throw new Error(
      `Página ${page} não encontrada na tabela do processo ${processo.id} (entradas: ${processo.pageTable.map((e) => e.page).join(', ')})`,
    );
  }
  const physical = asPhysical(entry.frame * PAGE_SIZE + offset);

  const steps: TranslationStep[] = [
    { kind: 'decompose', logical, page, offset },
    { kind: 'read-ptbr', processId: processo.id, ptbrOffset: processo.ptbrOffset },
    { kind: 'lookup-entry', page, frame: entry.frame },
    { kind: 'compute-physical', frame: entry.frame, offset, physical },
  ];

  return {
    logical,
    physical,
    frame: entry.frame,
    steps,
  };
}

export type { PageNumber };
```

- [ ] **Step 4: Run test, expect PASS**

Run:
```bash
bun run test src/domain/mmu.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/mmu.ts src/domain/mmu.test.ts
git commit -m "feat: add mmu translation returning ordered steps"
```

---

## Task 10 — Initial simulator state

**Files:**
- Create: `src/domain/initialState.ts`

- [ ] **Step 1: Write `src/domain/initialState.ts` with the table from CLAUDE.md**

```ts
import { PAGE_SIZE } from './constants';
import { asFrame, asLogical, asPage, type Process } from './types';

function variaveisPorPagina(): ReturnType<typeof asLogical>[] {
  return [
    asLogical(0 * PAGE_SIZE),
    asLogical(1 * PAGE_SIZE),
    asLogical(2 * PAGE_SIZE),
    asLogical(3 * PAGE_SIZE),
  ];
}

export const processosIniciais: Process[] = [
  {
    id: 'P1',
    ptbrOffset: 0x0000,
    pageTable: [
      { page: asPage(0), frame: asFrame(5) },
      { page: asPage(1), frame: asFrame(8) },
      { page: asPage(2), frame: asFrame(9) },
      { page: asPage(3), frame: asFrame(11) },
    ],
    variables: variaveisPorPagina(),
  },
  {
    id: 'P2',
    ptbrOffset: 0x0100,
    pageTable: [
      { page: asPage(0), frame: asFrame(1) },
      { page: asPage(1), frame: asFrame(2) },
      { page: asPage(2), frame: asFrame(12) },
      { page: asPage(3), frame: asFrame(13) },
    ],
    variables: variaveisPorPagina(),
  },
  {
    id: 'P3',
    ptbrOffset: 0x0200,
    pageTable: [
      { page: asPage(0), frame: asFrame(3) },
      { page: asPage(1), frame: asFrame(4) },
      { page: asPage(2), frame: asFrame(14) },
      { page: asPage(3), frame: asFrame(15) },
    ],
    variables: variaveisPorPagina(),
  },
];
```

- [ ] **Step 2: Run check + tests**

Run:
```bash
bun run check && bun run test
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add src/domain/initialState.ts
git commit -m "feat: add initial state for processes p1 p2 p3"
```

---

## Task 11 — Zustand store

**Files:**
- Create: `src/store/simulator.ts`, `src/store/simulator.test.ts`

- [ ] **Step 1: Write failing test `src/store/simulator.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useSimulatorStore } from './simulator';
import { asLogical } from '../domain/types';

describe('useSimulatorStore', () => {
  beforeEach(() => {
    useSimulatorStore.getState().resetarSimulacao();
  });

  it('starts with P1 active and no translation', () => {
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P1');
    expect(s.traducaoAtual).toBeNull();
  });

  it('selecionarProcesso changes active process and clears translation', () => {
    useSimulatorStore.getState().selecionarProcesso('P2');
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P2');
    expect(s.traducaoAtual).toBeNull();
  });

  it('acessarVariavel produces a translation for the active process', () => {
    useSimulatorStore.getState().acessarVariavel(asLogical(0x0400));
    const s = useSimulatorStore.getState();
    expect(s.traducaoAtual).not.toBeNull();
    expect(s.traducaoAtual?.frame).toBe(8);
  });

  it('resetarSimulacao restores initial state', () => {
    useSimulatorStore.getState().selecionarProcesso('P3');
    useSimulatorStore.getState().acessarVariavel(asLogical(0x0000));
    useSimulatorStore.getState().resetarSimulacao();
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P1');
    expect(s.traducaoAtual).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run:
```bash
bun run test src/store/simulator.test.ts
```

Expected: FAIL, missing module.

- [ ] **Step 3: Implement `src/store/simulator.ts`**

```ts
import { create } from 'zustand';
import { traduzirEndereco } from '../domain/mmu';
import { processosIniciais } from '../domain/initialState';
import type { LogicalAddress, Process, ProcessId, Translation } from '../domain/types';

type State = {
  processos: Process[];
  processoAtivo: ProcessId;
  traducaoAtual: Translation | null;
};

type Actions = {
  selecionarProcesso: (id: ProcessId) => void;
  acessarVariavel: (logical: LogicalAddress) => void;
  resetarSimulacao: () => void;
};

const estadoInicial: State = {
  processos: processosIniciais,
  processoAtivo: 'P1',
  traducaoAtual: null,
};

export const useSimulatorStore = create<State & Actions>((set, get) => ({
  ...estadoInicial,
  selecionarProcesso: (id) => set({ processoAtivo: id, traducaoAtual: null }),
  acessarVariavel: (logical) => {
    const { processos, processoAtivo } = get();
    const processo = processos.find((p) => p.id === processoAtivo);
    if (!processo) {
      throw new Error(`Processo ativo ${processoAtivo} não encontrado`);
    }
    set({ traducaoAtual: traduzirEndereco(processo, logical) });
  },
  resetarSimulacao: () => set({ ...estadoInicial }),
}));
```

- [ ] **Step 4: Run test, expect PASS**

Run:
```bash
bun run test src/store/simulator.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/simulator.ts src/store/simulator.test.ts
git commit -m "feat: add zustand store with select reset and translate actions"
```

---

## Task 12 — Color mapping per process

**Files:**
- Create: `src/lib/colors.ts`

- [ ] **Step 1: Write `src/lib/colors.ts`**

```ts
import type { ProcessId } from '../domain/types';

type ProcessColor = {
  bg: string;
  bgSoft: string;
  border: string;
  text: string;
  chip: string;
};

export const PROCESS_COLORS: Record<ProcessId, ProcessColor> = {
  P1: {
    bg: 'bg-primary-500',
    bgSoft: 'bg-primary-100-900',
    border: 'border-primary-500',
    text: 'text-primary-700-300',
    chip: 'preset-filled-primary-500',
  },
  P2: {
    bg: 'bg-success-500',
    bgSoft: 'bg-success-100-900',
    border: 'border-success-500',
    text: 'text-success-700-300',
    chip: 'preset-filled-success-500',
  },
  P3: {
    bg: 'bg-warning-500',
    bgSoft: 'bg-warning-100-900',
    border: 'border-warning-500',
    text: 'text-warning-700-300',
    chip: 'preset-filled-warning-500',
  },
};

export function coresDoProcesso(id: ProcessId): ProcessColor {
  return PROCESS_COLORS[id];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/colors.ts
git commit -m "feat: add process color mapping to skeleton tokens"
```

---

## Task 13 — App layout with three panels

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { MMUPanel } from './components/MMUPanel';
import { ProcessPanel } from './components/ProcessPanel';
import { RAMPanel } from './components/RAMPanel';
import { useSimulatorStore } from './store/simulator';

export function App() {
  const resetar = useSimulatorStore((s) => s.resetarSimulacao);

  return (
    <main className="min-h-screen bg-surface-50-950 p-4 text-surface-contrast-50-950">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="h2">Simulador de Paginação</h1>
          <p className="text-sm text-surface-700-300">Parte 1 — Tradução de Endereços</p>
        </div>
        <button type="button" className="btn preset-tonal" onClick={resetar}>
          Resetar
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <ProcessPanel />
        <MMUPanel />
        <RAMPanel />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Create placeholders for the three components**

Create `src/components/ProcessPanel.tsx`:
```tsx
export function ProcessPanel() {
  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-2">Processos</h2>
      <p className="text-sm text-surface-700-300">em construção</p>
    </section>
  );
}
```

Create `src/components/MMUPanel.tsx`:
```tsx
export function MMUPanel() {
  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-2">MMU</h2>
      <p className="text-sm text-surface-700-300">em construção</p>
    </section>
  );
}
```

Create `src/components/RAMPanel.tsx`:
```tsx
export function RAMPanel() {
  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-2">RAM</h2>
      <p className="text-sm text-surface-700-300">em construção</p>
    </section>
  );
}
```

- [ ] **Step 3: Boot and verify layout**

Run:
```bash
bun dev
```

Expected: header with reset button + 3 cards in a row (on lg+) or stacked (mobile). Kill server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/
git commit -m "feat: add three-panel layout with reset action"
```

---

## Task 14 — ProcessPanel

**Files:**
- Modify: `src/components/ProcessPanel.tsx`
- Create: `src/components/VariableButton.tsx`

- [ ] **Step 1: Create `src/components/VariableButton.tsx`**

```tsx
import type { LogicalAddress, ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';

type Props = {
  processoId: ProcessId;
  varIndex: number;
  logical: LogicalAddress;
  ativo: boolean;
};

export function VariableButton({ processoId, varIndex, logical, ativo }: Props) {
  const acessar = useSimulatorStore((s) => s.acessarVariavel);
  const cores = coresDoProcesso(processoId);

  return (
    <button
      type="button"
      disabled={!ativo}
      onClick={() => acessar(logical)}
      className={`btn btn-sm ${ativo ? cores.chip : 'preset-outlined-surface-500'} disabled:opacity-50`}
      title={`Endereço lógico 0x${logical.toString(16).padStart(4, '0').toUpperCase()}`}
    >
      var{varIndex} <span className="opacity-70">pg {Math.floor(logical / 1024)}</span>
    </button>
  );
}
```

- [ ] **Step 2: Replace `src/components/ProcessPanel.tsx`**

```tsx
import type { Process } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';
import { VariableButton } from './VariableButton';

export function ProcessPanel() {
  const processos = useSimulatorStore((s) => s.processos);
  const ativo = useSimulatorStore((s) => s.processoAtivo);
  const selecionar = useSimulatorStore((s) => s.selecionarProcesso);

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">Processos</h2>
      <div className="flex flex-col gap-3">
        {processos.map((p) => (
          <ProcessoCard
            key={p.id}
            processo={p}
            ativo={p.id === ativo}
            onSelecionar={() => selecionar(p.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ProcessoCard({
  processo,
  ativo,
  onSelecionar,
}: {
  processo: Process;
  ativo: boolean;
  onSelecionar: () => void;
}) {
  const cores = coresDoProcesso(processo.id);
  const ringClass = ativo ? `ring-2 ring-offset-2 ${cores.border}` : '';

  return (
    <article
      className={`rounded-base border border-surface-300-700 p-3 ${ringClass}`}
      onClick={onSelecionar}
    >
      <header className="mb-2 flex items-center justify-between">
        <h3 className={`h6 ${cores.text}`}>{processo.id}</h3>
        <span className="badge preset-tonal-surface text-xs">
          PTBR offset 0x{processo.ptbrOffset.toString(16).padStart(4, '0').toUpperCase()}
        </span>
      </header>

      <dl className="mb-2 text-xs text-surface-700-300">
        <dt className="font-semibold">TCB</dt>
        <dd>tabela em frame 0, offset 0x{processo.ptbrOffset.toString(16).padStart(4, '0').toUpperCase()}</dd>
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {processo.variables.map((logical, i) => (
          <VariableButton
            key={`${processo.id}-${i}`}
            processoId={processo.id}
            varIndex={i}
            logical={logical}
            ativo={ativo}
          />
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Boot and click variables**

Run:
```bash
bun dev
```

Expected: 3 process cards. Clicking a card highlights it (ring). Variable buttons enabled only on the active process. Clicking a variable does nothing visible yet (MMU is still placeholder), but no error in console.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProcessPanel.tsx src/components/VariableButton.tsx
git commit -m "feat: render process panel with tcb and variable buttons"
```

---

## Task 15 — RAMPanel with frame highlighting

**Files:**
- Modify: `src/components/RAMPanel.tsx`
- Create: `src/components/Frame.tsx`

- [ ] **Step 1: Create `src/components/Frame.tsx`**

```tsx
import { motion } from 'motion/react';
import type { FrameNumber, ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';

type Props = {
  index: number;
  ownerProcess: ProcessId | 'TABLES' | null;
  highlighted: boolean;
};

export function Frame({ index, ownerProcess, highlighted }: Props) {
  const baseColor = colorForOwner(ownerProcess);
  const enderecoInicial = (index * 1024).toString(16).padStart(4, '0').toUpperCase();

  return (
    <motion.div
      className={`rounded-base border border-surface-300-700 p-2 text-center text-xs ${baseColor}`}
      animate={highlighted ? { scale: [1, 1.08, 1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="font-bold">{index}</div>
      <div className="opacity-80">0x{enderecoInicial}</div>
      <div className="mt-0.5 opacity-70">{labelForOwner(ownerProcess)}</div>
    </motion.div>
  );
}

function colorForOwner(owner: ProcessId | 'TABLES' | null): string {
  if (owner === 'TABLES') return 'bg-surface-300-700 text-surface-contrast-300-700';
  if (owner === null) return 'bg-surface-100-900 text-surface-700-300';
  return `${coresDoProcesso(owner).bgSoft} ${coresDoProcesso(owner).text}`;
}

function labelForOwner(owner: ProcessId | 'TABLES' | null): string {
  if (owner === 'TABLES') return 'tabelas';
  if (owner === null) return 'livre';
  return owner;
}

export type { FrameNumber };
```

- [ ] **Step 2: Replace `src/components/RAMPanel.tsx`**

```tsx
import { RAM_FRAMES, FRAME_PAGE_TABLES } from '../domain/constants';
import type { ProcessId } from '../domain/types';
import { useSimulatorStore } from '../store/simulator';
import { Frame } from './Frame';

export function RAMPanel() {
  const processos = useSimulatorStore((s) => s.processos);
  const traducao = useSimulatorStore((s) => s.traducaoAtual);

  const owners: (ProcessId | 'TABLES' | null)[] = Array.from({ length: RAM_FRAMES }, (_, i) => {
    if (i === FRAME_PAGE_TABLES) return 'TABLES';
    const owner = processos.find((p) => p.pageTable.some((e) => e.frame === i));
    return owner?.id ?? null;
  });

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">RAM (16 quadros × 1 KiB)</h2>
      <div className="grid grid-cols-4 gap-2">
        {owners.map((owner, i) => (
          <Frame
            key={i}
            index={i}
            ownerProcess={owner}
            highlighted={traducao?.frame === i}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Boot and verify RAM**

Run:
```bash
bun dev
```

Expected: 16 frames in a 4×4 grid. Frame 0 labeled "tabelas". Frames 5/8/9/11 colored as P1, 1/2/12/13 as P2, 3/4/14/15 as P3. Frames 6/7/10 marked "livre". Clicking a P1 variable makes its target frame pulse for 600ms.

- [ ] **Step 4: Commit**

```bash
git add src/components/RAMPanel.tsx src/components/Frame.tsx
git commit -m "feat: render ram panel with frame ownership and pulse animation"
```

---

## Task 16 — MMUPanel with animated translation steps

**Files:**
- Modify: `src/components/MMUPanel.tsx`

- [ ] **Step 1: Replace `src/components/MMUPanel.tsx`**

```tsx
import { AnimatePresence, motion } from 'motion/react';
import type { TranslationStep } from '../domain/types';
import { useSimulatorStore } from '../store/simulator';

export function MMUPanel() {
  const traducao = useSimulatorStore((s) => s.traducaoAtual);

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">MMU</h2>
      {!traducao ? (
        <p className="text-sm text-surface-700-300">
          Clique em uma variável de um processo para ver a tradução passo a passo.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {traducao.steps.map((step, i) => (
              <motion.li
                key={`${traducao.logical}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.25, duration: 0.25 }}
                className="rounded-base bg-surface-100-900 p-3 text-sm"
              >
                <strong className="mr-2 text-primary-700-300">{i + 1}.</strong>
                {descreverPasso(step)}
              </motion.li>
            ))}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: traducao.steps.length * 0.25 + 0.1 }}
            className="mt-2 rounded-base bg-primary-100-900 p-3 text-sm font-semibold text-primary-700-300"
          >
            Endereço físico = 0x{traducao.physical.toString(16).padStart(4, '0').toUpperCase()} ({traducao.physical})
          </motion.div>
        </ol>
      )}
    </section>
  );
}

function descreverPasso(step: TranslationStep): string {
  switch (step.kind) {
    case 'decompose':
      return `Decompõe endereço lógico 0x${step.logical.toString(16).padStart(4, '0').toUpperCase()} → página ${step.page}, deslocamento 0x${step.offset.toString(16).padStart(3, '0').toUpperCase()}`;
    case 'read-ptbr':
      return `Lê PTBR de ${step.processId}: offset 0x${step.ptbrOffset.toString(16).padStart(4, '0').toUpperCase()} dentro do frame 0`;
    case 'lookup-entry':
      return `Consulta entrada da tabela: página ${step.page} → quadro ${step.frame}`;
    case 'compute-physical':
      return `Calcula endereço físico = ${step.frame} × 1024 + 0x${step.offset.toString(16).padStart(3, '0').toUpperCase()} = 0x${step.physical.toString(16).padStart(4, '0').toUpperCase()}`;
  }
}
```

- [ ] **Step 2: Boot and click variables of different processes**

Run:
```bash
bun dev
```

Expected:
1. Click `P1 var2` (logical `0x0800`): MMU shows 4 steps animating in sequence, final result `0x2400` (frame 9), frame 9 pulses.
2. Click `P3` card to select it, then `P3 var3`: result `0x3C00` (frame 15), frame 15 pulses.
3. Click "Resetar": panels reset, P1 active, no translation.

- [ ] **Step 3: Run full test suite**

Run:
```bash
bun run test
```

Expected: PASS all suites (address, mmu, simulator).

- [ ] **Step 4: Commit**

```bash
git add src/components/MMUPanel.tsx
git commit -m "feat: render mmu panel with animated translation steps"
```

---

## Task 17 — Frame 0 highlight: show which process's table is being read

**Files:**
- Modify: `src/components/RAMPanel.tsx`, `src/components/Frame.tsx`

The spec says: "O quadro 0 (tabelas) é sempre acessado primeiro". This task adds a secondary pulse on frame 0 when a translation runs, and a sub-highlight matching the active process color (since frame 0 contains all three tables, the PTBR offset of the active process is what's being read).

- [ ] **Step 1: Update `Frame.tsx` to accept an optional `secondaryHighlight` color**

Replace `Frame.tsx`:
```tsx
import { motion } from 'motion/react';
import type { FrameNumber, ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';

type Props = {
  index: number;
  ownerProcess: ProcessId | 'TABLES' | null;
  highlighted: boolean;
  secondaryHighlight?: ProcessId;
};

export function Frame({ index, ownerProcess, highlighted, secondaryHighlight }: Props) {
  const baseColor = colorForOwner(ownerProcess);
  const enderecoInicial = (index * 1024).toString(16).padStart(4, '0').toUpperCase();
  const ringClass = secondaryHighlight
    ? `ring-2 ring-offset-1 ${coresDoProcesso(secondaryHighlight).border}`
    : '';

  return (
    <motion.div
      className={`rounded-base border border-surface-300-700 p-2 text-center text-xs ${baseColor} ${ringClass}`}
      animate={highlighted ? { scale: [1, 1.08, 1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="font-bold">{index}</div>
      <div className="opacity-80">0x{enderecoInicial}</div>
      <div className="mt-0.5 opacity-70">{labelForOwner(ownerProcess)}</div>
    </motion.div>
  );
}

function colorForOwner(owner: ProcessId | 'TABLES' | null): string {
  if (owner === 'TABLES') return 'bg-surface-300-700 text-surface-contrast-300-700';
  if (owner === null) return 'bg-surface-100-900 text-surface-700-300';
  return `${coresDoProcesso(owner).bgSoft} ${coresDoProcesso(owner).text}`;
}

function labelForOwner(owner: ProcessId | 'TABLES' | null): string {
  if (owner === 'TABLES') return 'tabelas';
  if (owner === null) return 'livre';
  return owner;
}

export type { FrameNumber };
```

- [ ] **Step 2: Update `RAMPanel.tsx` to mark frame 0 with active-process color during translation**

Replace `RAMPanel.tsx`:
```tsx
import { RAM_FRAMES, FRAME_PAGE_TABLES } from '../domain/constants';
import type { ProcessId } from '../domain/types';
import { useSimulatorStore } from '../store/simulator';
import { Frame } from './Frame';

export function RAMPanel() {
  const processos = useSimulatorStore((s) => s.processos);
  const ativo = useSimulatorStore((s) => s.processoAtivo);
  const traducao = useSimulatorStore((s) => s.traducaoAtual);

  const owners: (ProcessId | 'TABLES' | null)[] = Array.from({ length: RAM_FRAMES }, (_, i) => {
    if (i === FRAME_PAGE_TABLES) return 'TABLES';
    const owner = processos.find((p) => p.pageTable.some((e) => e.frame === i));
    return owner?.id ?? null;
  });

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">RAM (16 quadros × 1 KiB)</h2>
      <div className="grid grid-cols-4 gap-2">
        {owners.map((owner, i) => (
          <Frame
            key={i}
            index={i}
            ownerProcess={owner}
            highlighted={traducao?.frame === i || (i === FRAME_PAGE_TABLES && traducao !== null)}
            secondaryHighlight={i === FRAME_PAGE_TABLES && traducao ? ativo : undefined}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Boot and verify**

Run:
```bash
bun dev
```

Expected: clicking a variable now pulses BOTH frame 0 (with a ring in the active process color) AND the destination frame.

- [ ] **Step 4: Commit**

```bash
git add src/components/RAMPanel.tsx src/components/Frame.tsx
git commit -m "feat: pulse frame 0 with active-process ring on translation"
```

---

## Task 18 — Final check: lint, format, tests, build

**Files:** none

- [ ] **Step 1: Run formatter + linter**

```bash
bun run format
bun run check
```

Expected: both exit 0.

- [ ] **Step 2: Run full test suite**

```bash
bun run test
```

Expected: all PASS.

- [ ] **Step 3: Run production build**

```bash
bun run build
```

Expected: builds to `dist/` with no TS errors.

- [ ] **Step 4: Preview production build**

```bash
bun run preview
```

Open the URL printed. Click through P1/P2/P3 and each of their variables. Verify the same behavior as in dev. Kill server.

- [ ] **Step 5: Commit any formatter-driven changes**

```bash
git status
# if anything is dirty:
git add -A
git commit -m "style: apply biome formatting"
```

- [ ] **Step 6: Tag a milestone**

```bash
git tag parte-1-completa
```

---

## Self-Review

**Spec coverage:**
- ✅ Visualizar mapeamento páginas lógicas ↔ quadros físicos: Tasks 14–16.
- ✅ Mostrar papel da MMU e PTBR: Task 16 (passos `read-ptbr` + `lookup-entry`).
- ✅ Exibir RAM graficamente: Task 15.
- ✅ Página 1 KiB, 4 páginas/processo, 16 frames: Tasks 7, 10.
- ✅ Frame 0 reservado p/ tabelas: Tasks 15, 17.
- ✅ PTBR offset por processo no TCB: Task 14.
- ✅ Tradução com decomposição + tabela + quadro + cálculo: Task 9.
- ✅ Clique na variável atualiza MMU: Tasks 11, 14, 16.
- ✅ Painel esquerdo (processos+TCB), central (MMU), direito (RAM colorida): Tasks 13–17.
- ✅ Frame correspondente pisca: Task 15.
- ✅ Quadro 0 acessado primeiro: Task 17.
- ❌ Page fault / swap / kernel frame: **OUT of scope** (Parte 2, per CLAUDE.md).

**Placeholder scan:** none — every step has runnable code or commands.

**Type consistency:**
- `traduzirEndereco` signature defined Task 9, consumed identically in Task 11.
- `Process`, `ProcessId`, `LogicalAddress` defined Task 6, used consistently.
- `coresDoProcesso` defined Task 12, used in Tasks 14, 15, 17.
- Store action names (`selecionarProcesso`, `acessarVariavel`, `resetarSimulacao`) match between definition (Task 11) and consumers (Tasks 13, 14).
