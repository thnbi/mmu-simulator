import { ArcherElement } from 'react-archer';
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
  const traducao = useSimulatorStore((s) => s.traducaoAtual);
  const cores = coresDoProcesso(processoId);

  const isCurrentSource = ativo && traducao?.logical === logical;
  const relations = isCurrentSource
    ? [
        {
          targetId: 'step-decompose',
          targetAnchor: 'left' as const,
          sourceAnchor: 'right' as const,
          style: { strokeColor: cores.stroke, strokeWidth: 2 },
          label: <span className="text-xs">acessa</span>,
        },
      ]
    : [];

  return (
    <ArcherElement id={`var-${processoId}-${varIndex}`} relations={relations}>
      <span className="inline-flex">
        <button
          type="button"
          disabled={!ativo}
          onClick={() => acessar(logical)}
          className={`btn btn-sm ${ativo ? cores.chip : 'preset-outlined-surface-500'} disabled:opacity-50`}
          title={`Endereço lógico 0x${logical.toString(16).padStart(4, '0').toUpperCase()}`}
        >
          var{varIndex} <span className="opacity-70">pg {Math.floor(logical / 1024)}</span>
        </button>
      </span>
    </ArcherElement>
  );
}
