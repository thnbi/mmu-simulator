import { ArcherContainer } from 'react-archer';
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
    </main>
  );
}
