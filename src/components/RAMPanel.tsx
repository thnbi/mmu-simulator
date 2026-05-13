import { FRAME_PAGE_TABLES, RAM_FRAMES } from '../domain/constants';
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
          <Frame // biome-ignore lint/suspicious/noArrayIndexKey: frame index is the natural identity
            key={i}
            index={i}
            ownerProcess={owner}
            highlighted={traducao?.frame === i || (i === FRAME_PAGE_TABLES && traducao !== null)}
            secondaryHighlight={i === FRAME_PAGE_TABLES && traducao !== null ? ativo : undefined}
          />
        ))}
      </div>
    </section>
  );
}
