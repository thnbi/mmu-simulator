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
  const ptbrHex = processo.ptbrOffset.toString(16).padStart(4, '0').toUpperCase();

  return (
    <article
      className={`rounded-base border border-surface-300-700 p-3 ${ringClass}`}
      onClick={onSelecionar}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelecionar();
      }}
    >
      <header className="mb-2 flex items-center justify-between">
        <h3 className={`h6 ${cores.text}`}>{processo.id}</h3>
        <span className="badge preset-tonal-surface text-xs">PTBR offset 0x{ptbrHex}</span>
      </header>

      <dl className="mb-2 text-xs text-surface-700-300">
        <dt className="font-semibold">TCB</dt>
        <dd>tabela em frame 0, offset 0x{ptbrHex}</dd>
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {processo.variables.map((logical) => (
          <VariableButton
            key={`${processo.id}-${logical}`}
            processoId={processo.id}
            varIndex={processo.variables.indexOf(logical)}
            logical={logical}
            ativo={ativo}
          />
        ))}
      </div>
    </article>
  );
}
