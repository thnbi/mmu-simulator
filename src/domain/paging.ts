import { decomporEndereco } from './address';
import {
  FRAME_KERNEL,
  FRAME_PAGE_TABLES,
  PAGE_SIZE,
  USER_FRAME_MAX,
  USER_FRAME_MIN,
} from './constants';
import {
  asPhysical,
  type FrameNumber,
  type LogicalAddress,
  type MMUResult,
  type PageNumber,
  type PageTableEntryV2,
  type ProcessV2,
  type SwapContent,
  type SwapSlot,
  type TranslationStep,
} from './types';

export function consultarMMU(processo: ProcessV2, logical: LogicalAddress): MMUResult {
  const { page, offset } = decomporEndereco(logical);
  const entry = processo.pageTable.find((e) => e.page === page);
  if (!entry) {
    throw new Error(
      `Página ${page} ausente na tabela do processo ${processo.id} (entradas: ${processo.pageTable.map((e) => e.page).join(', ')})`,
    );
  }

  if (entry.state === 'INV') {
    return { kind: 'fault-invalid', processId: processo.id, logical, page, offset };
  }
  if (entry.state === 'SWAP') {
    return { kind: 'fault-swap', processId: processo.id, logical, page, offset, slot: entry.slot };
  }

  const physical = asPhysical(entry.frame * PAGE_SIZE + offset);
  const steps: TranslationStep[] = [
    { kind: 'decompose', logical, page, offset },
    { kind: 'read-ptbr', processId: processo.id, ptbrOffset: processo.ptbrOffset },
    { kind: 'lookup-entry', page, frame: entry.frame },
    { kind: 'compute-physical', frame: entry.frame, offset, physical },
  ];
  return {
    kind: 'translated',
    processId: processo.id,
    logical,
    page,
    offset,
    frame: entry.frame,
    physical,
    steps,
  };
}

export type FrameValidation =
  | { ok: true }
  | { ok: false; reason: 'kernel' | 'page-tables' | 'out-of-range' | 'in-use' };

export function validarFrameAlvo(processos: ProcessV2[], frame: FrameNumber): FrameValidation {
  if (frame === FRAME_KERNEL) return { ok: false, reason: 'kernel' };
  if (frame === FRAME_PAGE_TABLES) return { ok: false, reason: 'page-tables' };
  if (frame < USER_FRAME_MIN || frame > USER_FRAME_MAX)
    return { ok: false, reason: 'out-of-range' };
  if (frameOcupadoPor(processos, frame) !== null) return { ok: false, reason: 'in-use' };
  return { ok: true };
}

export function frameOcupadoPor(
  processos: ProcessV2[],
  frame: FrameNumber,
): { processId: ProcessV2['id']; page: PageNumber } | null {
  for (const p of processos) {
    for (const e of p.pageTable) {
      if (e.state === 'RAM' && e.frame === frame) {
        return { processId: p.id, page: e.page };
      }
    }
  }
  return null;
}

export function framesUsuarioLivres(processos: ProcessV2[]): FrameNumber[] {
  const livres: FrameNumber[] = [];
  for (let f = USER_FRAME_MIN; f <= USER_FRAME_MAX; f++) {
    if (frameOcupadoPor(processos, f as FrameNumber) === null) {
      livres.push(f as FrameNumber);
    }
  }
  return livres;
}

export function framesUsuarioOcupados(
  processos: ProcessV2[],
): { frame: FrameNumber; processId: ProcessV2['id']; page: PageNumber }[] {
  const ocupados: { frame: FrameNumber; processId: ProcessV2['id']; page: PageNumber }[] = [];
  for (let f = USER_FRAME_MIN; f <= USER_FRAME_MAX; f++) {
    const owner = frameOcupadoPor(processos, f as FrameNumber);
    if (owner !== null) ocupados.push({ frame: f as FrameNumber, ...owner });
  }
  return ocupados;
}

export function acharSwapLivre(swap: (SwapContent | null)[]): SwapSlot | null {
  const idx = swap.indexOf(null);
  if (idx === -1) return null;
  return (idx + 16) as SwapSlot;
}

export function setEntry(
  processos: ProcessV2[],
  processId: ProcessV2['id'],
  page: PageNumber,
  entry: PageTableEntryV2,
): ProcessV2[] {
  return processos.map((p) =>
    p.id !== processId
      ? p
      : {
          ...p,
          pageTable: p.pageTable.map((e) => (e.page === page ? entry : e)),
        },
  );
}

export function alocarPaginaEmFrame(
  processos: ProcessV2[],
  processId: ProcessV2['id'],
  page: PageNumber,
  frame: FrameNumber,
): ProcessV2[] {
  return setEntry(processos, processId, page, { page, state: 'RAM', frame });
}

export function escreverSwap(
  swap: (SwapContent | null)[],
  slot: SwapSlot,
  content: SwapContent,
): (SwapContent | null)[] {
  const idx = slot - 16;
  if (idx < 0 || idx >= swap.length) {
    throw new RangeError(`Slot de swap inválido: ${slot} (esperado 16..${16 + swap.length - 1})`);
  }
  const next = swap.slice();
  next[idx] = content;
  return next;
}

export function liberarSwap(swap: (SwapContent | null)[], slot: SwapSlot): (SwapContent | null)[] {
  const idx = slot - 16;
  if (idx < 0 || idx >= swap.length) {
    throw new RangeError(`Slot de swap inválido: ${slot} (esperado 16..${16 + swap.length - 1})`);
  }
  const next = swap.slice();
  next[idx] = null;
  return next;
}
