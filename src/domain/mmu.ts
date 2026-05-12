import { decomporEndereco } from './address';
import { PAGE_SIZE } from './constants';
import {
  asPhysical,
  type LogicalAddress,
  type Process,
  type Translation,
  type TranslationStep,
} from './types';

export function traduzirEndereco(processo: Process, logical: LogicalAddress): Translation {
  const { page, offset } = decomporEndereco(logical);
  const entry = processo.pageTable.find((e) => e.page === page);
  if (!entry) {
    throw new Error(
      `Página ${page} não encontrada na tabela do processo ${processo.id} (entradas: ${processo.pageTable.map((e) => e.page).join(', ')})`,
    );
  }
  const physical = asPhysical(entry.frame * PAGE_SIZE + offset);

  const steps: TranslationStep[] = [
    { kind: 'decompose', logical, page, offset },
    { kind: 'read-ptbr', processId: processo.id, ptbrOffset: processo.ptbrOffset },
    { kind: 'lookup-entry', page, frame: entry.frame },
    { kind: 'compute-physical', frame: entry.frame, offset, physical },
  ];

  return {
    logical,
    physical,
    frame: entry.frame,
    steps,
  };
}
