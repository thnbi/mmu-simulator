import type { PageTableEntryV2, ProcessV2 } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';
import { VariableButtonV2 } from './VariableButtonV2';

export function ProcessPanelV2() {
  const processos = useSimulatorStore((s) => s.processosV2);
  const ativo = useSimulatorStore((s) => s.processoAtivo);
  const selecionar = useSimulatorStore((s) => s.selecionarProcesso);

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">Processos</h2>
      <div className="flex flex-col gap-3">
        {processos.map((p) => (
          <ProcessoV2Card
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

function ProcessoV2Card({
  processo,
  ativo,
  onSelecionar,
}: {
  processo: ProcessV2;
  ativo: boolean;
  onSelecionar: () => void;
}) {
  const cores = coresDoProcesso(processo.id);
  const ringClass = ativo ? `ring-2 ring-offset-2 ${cores.border}` : '';
  const ptbrHex = processo.ptbrOffset.toString(16).padStart(4, '0').toUpperCase();

  return (
    <article className={`rounded-base border border-surface-300-700 p-3 ${ringClass}`}>
      <button type="button" onClick={onSelecionar} className="w-full cursor-pointer text-left">
        <header className="mb-2 flex items-center justify-between">
          <h3 className={`h6 ${cores.text}`}>{processo.id}</h3>
          <span className="badge preset-tonal-surface text-xs">PTBR offset 0x{ptbrHex}</span>
        </header>

        <table className="mb-2 w-full text-xs">
          <thead className="text-surface-700-300">
            <tr>
              <th className="text-left font-semibold">Pág</th>
              <th className="text-left font-semibold">Estado</th>
              <th className="text-left font-semibold">Loc.</th>
            </tr>
          </thead>
          <tbody>
            {processo.pageTable.map((entry) => (
              <PageRow key={entry.page} entry={entry} />
            ))}
          </tbody>
        </table>
      </button>

      <div className="flex flex-wrap gap-1.5">
        {processo.variables.map((logical, varIndex) => (
          <VariableButtonV2
            key={`${processo.id}-${logical}`}
            processoId={processo.id}
            varIndex={varIndex}
            logical={logical}
            ativo={ativo}
          />
        ))}
      </div>
    </article>
  );
}

function PageRow({ entry }: { entry: PageTableEntryV2 }) {
  if (entry.state === 'INV') {
    return (
      <tr className="text-surface-700-300">
        <td>{entry.page}</td>
        <td>
          <span className="badge preset-outlined-surface-500 text-[10px]">INV</span>
        </td>
        <td className="italic opacity-60">—</td>
      </tr>
    );
  }
  if (entry.state === 'RAM') {
    return (
      <tr>
        <td>{entry.page}</td>
        <td>
          <span className="badge preset-filled-success-500 text-[10px]">RAM</span>
        </td>
        <td>quadro {entry.frame}</td>
      </tr>
    );
  }
  return (
    <tr>
      <td>{entry.page}</td>
      <td>
        <span className="badge preset-filled-warning-500 text-[10px]">SWAP</span>
      </td>
      <td>slot {entry.slot}</td>
    </tr>
  );
}
