import type { LogicalAddress, ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';

type Props = {
  processoId: ProcessId;
  varIndex: number;
  logical: LogicalAddress;
  ativo: boolean;
};

export function VariableButtonV2({ processoId, varIndex, logical, ativo }: Props) {
  const acessar = useSimulatorStore((s) => s.acessarVariavelV2);
  const pendingFault = useSimulatorStore(
    (s) => s.resultadoMMU?.kind === 'fault-invalid' || s.resultadoMMU?.kind === 'fault-swap',
  );
  const cores = coresDoProcesso(processoId);
  const disabled = !ativo || pendingFault;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => acessar(logical)}
      className={`btn btn-sm ${ativo ? cores.chip : 'preset-outlined-surface-500'} disabled:opacity-50`}
      title={`Endereço lógico 0x${logical.toString(16).padStart(4, '0').toUpperCase()}`}
    >
      var{varIndex} <span className="opacity-70">pg {Math.floor(logical / 1024)}</span>
    </button>
  );
}
