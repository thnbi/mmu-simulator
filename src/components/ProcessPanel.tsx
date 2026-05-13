import type { PageTableEntry, Process, ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';
import { VariableButton } from './VariableButton';

const PAGE_SIZE = 1024;

const PROCESS_EMOJI: Record<ProcessId, string> = {
  P1: '🟦',
  P2: '🟩',
  P3: '🟧',
};

const SECTION_LABEL_CLASS =
  'text-[0.7rem] font-semibold uppercase tracking-wide text-surface-600-400 mb-1';

// ---------------------------------------------------------------------------
// PaginaRow
// ---------------------------------------------------------------------------

type PaginaRowProps = {
  paginaN: number;
  ativo: boolean;
  processoId: ProcessId;
  logical: number;
  destacada: boolean;
  cores: ReturnType<typeof coresDoProcesso>;
};

function PaginaRow({ paginaN, ativo, processoId, logical, destacada, cores }: PaginaRowProps) {
  const startHex = (paginaN * PAGE_SIZE).toString(16).padStart(4, '0').toUpperCase();
  const endHex = ((paginaN + 1) * PAGE_SIZE - 1).toString(16).padStart(4, '0').toUpperCase();

  const highlightClass = destacada ? `ring-1 ${cores.border} bg-surface-200-800` : cores.bgSoft;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 ${highlightClass} transition-colors`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-surface-700-300">Pág {paginaN}</div>
        <div className="font-mono text-[0.65rem] tabular-nums text-surface-500-500">
          0x{startHex}–0x{endHex}
        </div>
      </div>
      <div className="shrink-0">
        <VariableButton
          processoId={processoId}
          varIndex={paginaN}
          logical={logical as number & { readonly __brand: 'LogicalAddress' }}
          ativo={ativo}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabelaPaginas
// ---------------------------------------------------------------------------

type TabelaPaginasProps = {
  entries: PageTableEntry[];
  paginaDestacada: number | null;
  cores: ReturnType<typeof coresDoProcesso>;
};

function TabelaPaginas({ entries, paginaDestacada, cores }: TabelaPaginasProps) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-surface-300-700">
          <th className="pb-0.5 text-left font-semibold text-surface-600-400">Pág</th>
          <th className="pb-0.5 text-left font-semibold text-surface-600-400">Quadro</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const isHighlighted = paginaDestacada === entry.page;
          return (
            <tr
              key={entry.page}
              className={`${isHighlighted ? `${cores.bgSoft} font-semibold` : ''} transition-colors`}
            >
              <td
                className={`py-0.5 font-mono tabular-nums ${isHighlighted ? cores.text : 'text-surface-700-300'}`}
              >
                {entry.page}
              </td>
              <td
                className={`py-0.5 font-mono tabular-nums ${isHighlighted ? cores.text : 'text-surface-700-300'}`}
              >
                {entry.frame}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// ProcessoCard
// ---------------------------------------------------------------------------

function ProcessoCard({
  processo,
  ativo,
  onSelecionar,
}: {
  processo: Process;
  ativo: boolean;
  onSelecionar: () => void;
}) {
  const traducao = useSimulatorStore((s) => s.traducaoAtual);
  const cores = coresDoProcesso(processo.id);
  const ringClass = ativo ? `ring-2 ring-offset-2 ${cores.border}` : '';
  const ptbrHex = processo.ptbrOffset.toString(16).padStart(4, '0').toUpperCase();

  // Determine which page is currently being translated (only for the active process)
  let paginaDestacada: number | null = null;
  if (ativo && traducao !== null) {
    const decomposeStep = traducao.steps.find((s) => s.kind === 'decompose');
    if (decomposeStep && decomposeStep.kind === 'decompose') {
      paginaDestacada = decomposeStep.page;
    }
  }

  return (
    <article className={`rounded-base border border-surface-300-700 overflow-hidden ${ringClass}`}>
      {/* Header + TCB — clickable to select process */}
      <button
        type="button"
        onClick={onSelecionar}
        className={`w-full cursor-pointer text-left p-3 ${cores.bgSoft}`}
      >
        <header className="mb-2 flex items-center gap-2">
          <span className="text-xl leading-none">{PROCESS_EMOJI[processo.id]}</span>
          <h3 className={`h6 flex-1 font-bold ${cores.text}`}>{processo.id}</h3>
          <span className="badge preset-tonal-surface font-mono text-[0.65rem] tabular-nums">
            PTBR 0x{ptbrHex}
          </span>
        </header>

        {/* TCB box */}
        <div className="border border-dashed border-surface-300-700 rounded-base p-2">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-surface-500-500 mb-1">
            TCB
          </div>
          <div className="font-mono text-xs tabular-nums text-surface-700-300">
            PTBR offset: 0x{ptbrHex}
          </div>
          <div className="font-mono text-xs tabular-nums text-surface-700-300">
            Tabela em: Frame 0
          </div>
        </div>
      </button>

      {/* Body — Espaço Virtual + Tabela de Páginas */}
      <div className="p-3 flex flex-col gap-3">
        {/* Espaço Virtual */}
        <div>
          <div className={SECTION_LABEL_CLASS}>Espaço Virtual</div>
          <div className="flex flex-col gap-1">
            {processo.pageTable.map((entry) => (
              <PaginaRow
                key={`pag-${entry.page}`}
                paginaN={entry.page}
                ativo={ativo}
                processoId={processo.id}
                logical={processo.variables[entry.page]!}
                destacada={paginaDestacada === entry.page}
                cores={cores}
              />
            ))}
          </div>
        </div>

        {/* Tabela de Páginas */}
        <div>
          <div className={SECTION_LABEL_CLASS}>Tabela de Páginas</div>
          <TabelaPaginas
            entries={processo.pageTable}
            paginaDestacada={paginaDestacada}
            cores={cores}
          />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// ProcessPanel (top-level — keep selectors here)
// ---------------------------------------------------------------------------

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
