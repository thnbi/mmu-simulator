import { motion } from 'motion/react';
import { FRAME_KERNEL, FRAME_PAGE_TABLES, RAM_FRAMES, SWAP_SLOT_MIN } from '../domain/constants';
import { frameOcupadoPor } from '../domain/paging';
import { asFrame, type ProcessId } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';

export function RAMPanelV2() {
  const processos = useSimulatorStore((s) => s.processosV2);
  const swap = useSimulatorStore((s) => s.swapArea);
  const resultado = useSimulatorStore((s) => s.resultadoMMU);

  const highlightFrame = resultado?.kind === 'translated' ? resultado.frame : null;
  const highlightSwap = resultado?.kind === 'fault-swap' ? resultado.slot : null;

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">RAM + Swap</h2>

      <div className="mb-4">
        <p className="mb-2 text-xs text-surface-700-300">RAM (quadros 0–15)</p>
        <div className="flex flex-col gap-1">
          {Array.from({ length: RAM_FRAMES }, (_, i) => {
            const owner = frameOcupadoPor(processos, asFrame(i));
            return (
              <FrameLinha // biome-ignore lint/suspicious/noArrayIndexKey: frame index is the natural identity
                key={i}
                index={i}
                ownerId={owner?.processId ?? null}
                ownerPage={owner?.page ?? null}
                highlighted={highlightFrame === i}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-surface-700-300">Swap (slots 16–23, em disco)</p>
        <div className="grid grid-cols-2 gap-1">
          {swap.map((content, i) => {
            const slot = SWAP_SLOT_MIN + i;
            return (
              <SwapCell // biome-ignore lint/suspicious/noArrayIndexKey: slot index is the identity
                key={i}
                slot={slot}
                ownerId={content?.processId ?? null}
                ownerPage={content?.page ?? null}
                highlighted={highlightSwap === slot}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

type FrameLinhaProps = {
  index: number;
  ownerId: ProcessId | null;
  ownerPage: number | null;
  highlighted: boolean;
};

function FrameLinha({ index, ownerId, ownerPage, highlighted }: FrameLinhaProps) {
  const reservado =
    index === FRAME_PAGE_TABLES ? 'tabelas' : index === FRAME_KERNEL ? 'kernel' : null;
  const enderecoInicial = (index * 1024).toString(16).padStart(4, '0').toUpperCase();

  let bg = 'bg-surface-100-900';
  let label = 'livre';
  let labelColor = 'text-surface-700-300';
  if (reservado === 'tabelas') {
    bg = 'bg-surface-300-700';
    label = 'tabelas';
    labelColor = 'text-surface-contrast-300-700';
  } else if (reservado === 'kernel') {
    bg = 'bg-error-200-800';
    label = 'kernel (protegido)';
    labelColor = 'text-error-700-300';
  } else if (ownerId) {
    const cores = coresDoProcesso(ownerId);
    bg = cores.bgSoft;
    label = `${ownerId} · pg ${ownerPage}`;
    labelColor = cores.text;
  }

  return (
    <motion.div
      className={`flex items-center justify-between rounded-base border border-surface-300-700 px-2 py-1 text-xs ${bg}`}
      animate={highlighted ? { scale: [1, 1.04, 1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <span className="font-mono opacity-80">0x{enderecoInicial}</span>
      <span className="font-bold">{index}</span>
      <span className={`${labelColor} text-right`}>{label}</span>
    </motion.div>
  );
}

type SwapCellProps = {
  slot: number;
  ownerId: ProcessId | null;
  ownerPage: number | null;
  highlighted: boolean;
};

function SwapCell({ slot, ownerId, ownerPage, highlighted }: SwapCellProps) {
  const cores = ownerId ? coresDoProcesso(ownerId) : null;
  const bg = cores ? cores.bgSoft : 'bg-surface-100-900';
  const textColor = cores ? cores.text : 'text-surface-700-300';
  return (
    <motion.div
      className={`rounded-base border border-dashed border-surface-300-700 p-2 text-center text-xs ${bg}`}
      animate={highlighted ? { scale: [1, 1.06, 1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="font-bold">{slot}</div>
      <div className={textColor}>{ownerId ? `${ownerId} · pg ${ownerPage}` : 'livre'}</div>
    </motion.div>
  );
}
