import { motion } from 'motion/react';
import type { ProcessId } from '../domain/types';
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
