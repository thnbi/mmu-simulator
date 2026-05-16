import { ArcherContainer } from 'react-archer';
import { EventLog } from './components/EventLog';
import { MMUPanel } from './components/MMUPanel';
import { MMUPanelV2 } from './components/MMUPanelV2';
import { ProcessPanel } from './components/ProcessPanel';
import { ProcessPanelV2 } from './components/ProcessPanelV2';
import { RAMPanel } from './components/RAMPanel';
import { RAMPanelV2 } from './components/RAMPanelV2';
import { type Mode, useSimulatorStore } from './store/simulator';

export function App() {
  const resetar = useSimulatorStore((s) => s.resetarSimulacao);
  const mode = useSimulatorStore((s) => s.mode);
  const setMode = useSimulatorStore((s) => s.setMode);

  return (
    <main className="min-h-screen bg-surface-50-950 p-4 text-surface-contrast-50-950">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="h2">Simulador de Paginação</h1>
          <p className="text-sm text-surface-700-300">
            {mode === 'part1'
              ? 'Parte 1 — Tradução de Endereços'
              : 'Parte 2 — Page Fault, Alocação Sob Demanda e Swap'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <button type="button" className="btn preset-tonal" onClick={resetar}>
            Resetar
          </button>
        </div>
      </header>

      {mode === 'part1' ? <Part1Layout /> : <Part2Layout />}
    </main>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="tablist" className="flex rounded-base border border-surface-300-700 p-0.5">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'part1'}
        onClick={() => onChange('part1')}
        className={`btn btn-sm ${mode === 'part1' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}`}
      >
        Parte 1
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'part2'}
        onClick={() => onChange('part2')}
        className={`btn btn-sm ${mode === 'part2' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}`}
      >
        Parte 2
      </button>
    </div>
  );
}

function Part1Layout() {
  return (
    <ArcherContainer
      strokeColor="var(--color-surface-700-300)"
      strokeWidth={2}
      endShape={{ arrow: { arrowLength: 4, arrowThickness: 4 } }}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <ProcessPanel />
        <MMUPanel />
        <RAMPanel />
      </section>
    </ArcherContainer>
  );
}

function Part2Layout() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
      <ProcessPanelV2 />
      <div className="flex flex-col gap-4">
        <MMUPanelV2 />
        <EventLog />
      </div>
      <RAMPanelV2 />
    </div>
  );
}
