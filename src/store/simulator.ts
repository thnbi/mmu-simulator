import { create } from 'zustand';
import { processosIniciais } from '../domain/initialState';
import { processosIniciaisV2, swapAreaInicial } from '../domain/initialStateV2';
import { traduzirEndereco } from '../domain/mmu';
import {
  acharSwapLivre,
  alocarPaginaEmFrame,
  consultarMMU,
  escreverSwap,
  frameOcupadoPor,
  liberarSwap,
  setEntry,
  validarFrameAlvo,
} from '../domain/paging';
import type {
  FrameNumber,
  LogicalAddress,
  MMUResult,
  PageNumber,
  Process,
  ProcessId,
  ProcessV2,
  SwapContent,
  SwapSlot,
  Translation,
} from '../domain/types';

export type Mode = 'part1' | 'part2';

export type EventEntry = {
  id: number;
  kind:
    | 'translate'
    | 'fault-invalid'
    | 'fault-swap'
    | 'allocate'
    | 'swap-in'
    | 'evict'
    | 'violation'
    | 'info';
  message: string;
};

type State = {
  mode: Mode;
  // Part 1
  processos: Process[];
  traducaoAtual: Translation | null;
  // Part 2
  processosV2: ProcessV2[];
  swapArea: (SwapContent | null)[];
  resultadoMMU: MMUResult | null;
  eventos: EventEntry[];
  // shared
  processoAtivo: ProcessId;
};

type Actions = {
  setMode: (mode: Mode) => void;
  selecionarProcesso: (id: ProcessId) => void;
  acessarVariavel: (logical: LogicalAddress) => void;
  acessarVariavelV2: (logical: LogicalAddress) => void;
  resolverFalta: (frame: FrameNumber) => void;
  evictarEAlocar: (victim: FrameNumber) => void;
  cancelarFalta: () => void;
  tentarMapearKernel: () => void;
  resetarSimulacao: () => void;
};

const estadoInicial: State = {
  mode: 'part1',
  processos: processosIniciais,
  traducaoAtual: null,
  processosV2: processosIniciaisV2,
  swapArea: swapAreaInicial,
  resultadoMMU: null,
  eventos: [],
  processoAtivo: 'P1',
};

let eventSeq = 0;
function appendEvento(
  eventos: EventEntry[],
  kind: EventEntry['kind'],
  message: string,
): EventEntry[] {
  eventSeq += 1;
  return [...eventos, { id: eventSeq, kind, message }];
}

function processoPorId(processos: ProcessV2[], id: ProcessId): ProcessV2 {
  const p = processos.find((x) => x.id === id);
  if (!p) {
    throw new Error(`Processo ${id} ausente (ids: ${processos.map((x) => x.id).join(', ')})`);
  }
  return p;
}

function pendingFault(
  result: MMUResult | null,
): result is Extract<MMUResult, { kind: 'fault-invalid' | 'fault-swap' }> {
  return result?.kind === 'fault-invalid' || result?.kind === 'fault-swap';
}

export const useSimulatorStore = create<State & Actions>((set, get) => ({
  ...estadoInicial,

  setMode: (mode) =>
    set({
      mode,
      traducaoAtual: null,
      resultadoMMU: null,
    }),

  selecionarProcesso: (id) => set({ processoAtivo: id, traducaoAtual: null, resultadoMMU: null }),

  acessarVariavel: (logical) => {
    const { processos, processoAtivo } = get();
    const processo = processos.find((p) => p.id === processoAtivo);
    if (!processo) {
      throw new Error(
        `Processo ativo ${processoAtivo} ausente (ids: ${processos.map((p) => p.id).join(', ')})`,
      );
    }
    set({ traducaoAtual: traduzirEndereco(processo, logical) });
  },

  acessarVariavelV2: (logical) => {
    const { processosV2, processoAtivo, eventos } = get();
    const processo = processoPorId(processosV2, processoAtivo);
    const result = consultarMMU(processo, logical);
    let nextEventos = eventos;
    if (result.kind === 'translated') {
      nextEventos = appendEvento(
        eventos,
        'translate',
        `${processoAtivo}: traduziu 0x${hex(logical, 4)} → quadro ${result.frame} (físico 0x${hex(result.physical, 4)}).`,
      );
    } else if (result.kind === 'fault-invalid') {
      nextEventos = appendEvento(
        eventos,
        'fault-invalid',
        `Page fault em ${processoAtivo}: página ${result.page} inválida. Escolha um quadro para alocar.`,
      );
    } else {
      nextEventos = appendEvento(
        eventos,
        'fault-swap',
        `Page fault em ${processoAtivo}: página ${result.page} na swap (slot ${result.slot}). Escolha um quadro para swap-in.`,
      );
    }
    set({ resultadoMMU: result, eventos: nextEventos });
  },

  resolverFalta: (frame) => {
    const { resultadoMMU, processosV2, swapArea, eventos } = get();
    if (!pendingFault(resultadoMMU)) return;

    const validacao = validarFrameAlvo(processosV2, frame);
    if (!validacao.ok) {
      const msg = mensagemRejeicao(validacao.reason, frame);
      set({
        eventos: appendEvento(eventos, validacao.reason === 'kernel' ? 'violation' : 'info', msg),
      });
      return;
    }

    if (resultadoMMU.kind === 'fault-invalid') {
      const processos = alocarPaginaEmFrame(
        processosV2,
        resultadoMMU.processId,
        resultadoMMU.page,
        frame,
      );
      const eventosNext = appendEvento(
        eventos,
        'allocate',
        `${resultadoMMU.processId}: página ${resultadoMMU.page} alocada no quadro ${frame}.`,
      );
      set({ processosV2: processos, eventos: eventosNext });
      replayTraducao(set, get);
      return;
    }

    // fault-swap: bring page in, free its swap slot
    const processos = alocarPaginaEmFrame(
      processosV2,
      resultadoMMU.processId,
      resultadoMMU.page,
      frame,
    );
    const nextSwap = liberarSwap(swapArea, resultadoMMU.slot);
    const eventosNext = appendEvento(
      eventos,
      'swap-in',
      `${resultadoMMU.processId}: swap-in da página ${resultadoMMU.page} do slot ${resultadoMMU.slot} para o quadro ${frame}.`,
    );
    set({ processosV2: processos, swapArea: nextSwap, eventos: eventosNext });
    replayTraducao(set, get);
  },

  evictarEAlocar: (victim) => {
    const { resultadoMMU, processosV2, swapArea, eventos } = get();
    if (!pendingFault(resultadoMMU)) return;

    const owner = frameOcupadoPor(processosV2, victim);
    if (!owner) {
      set({
        eventos: appendEvento(
          eventos,
          'info',
          `Quadro ${victim} já está livre — use o botão de alocar.`,
        ),
      });
      return;
    }

    const slotLivre = acharSwapLivre(swapArea);
    if (slotLivre === null) {
      set({
        eventos: appendEvento(
          eventos,
          'info',
          `Swap cheia — não há slot livre para enviar a página.`,
        ),
      });
      return;
    }

    // 1. write evicted page into swap, 2. mark evicted page entry as SWAP,
    // 3. allocate the fault page into the now-free frame
    const swapApos = escreverSwap(swapArea, slotLivre, {
      processId: owner.processId,
      page: owner.page,
    });
    let processos = setEntry(processosV2, owner.processId, owner.page, {
      page: owner.page,
      state: 'SWAP',
      slot: slotLivre,
    });
    processos = alocarPaginaEmFrame(processos, resultadoMMU.processId, resultadoMMU.page, victim);

    let eventosNext = appendEvento(
      eventos,
      'evict',
      `Evicção: ${owner.processId} página ${owner.page} (quadro ${victim}) → swap slot ${slotLivre}.`,
    );

    if (resultadoMMU.kind === 'fault-swap') {
      const swapFinal = liberarSwap(swapApos, resultadoMMU.slot);
      eventosNext = appendEvento(
        eventosNext,
        'swap-in',
        `${resultadoMMU.processId}: swap-in da página ${resultadoMMU.page} do slot ${resultadoMMU.slot} para o quadro ${victim}.`,
      );
      set({ processosV2: processos, swapArea: swapFinal, eventos: eventosNext });
    } else {
      eventosNext = appendEvento(
        eventosNext,
        'allocate',
        `${resultadoMMU.processId}: página ${resultadoMMU.page} alocada no quadro ${victim}.`,
      );
      set({ processosV2: processos, swapArea: swapApos, eventos: eventosNext });
    }
    replayTraducao(set, get);
  },

  cancelarFalta: () =>
    set((s) => ({
      resultadoMMU: null,
      eventos: appendEvento(s.eventos, 'info', 'Falta de página cancelada.'),
    })),

  tentarMapearKernel: () =>
    set((s) => ({
      eventos: appendEvento(
        s.eventos,
        'violation',
        `Violação de proteção — ${s.processoAtivo} tentou mapear o quadro 1 (kernel).`,
      ),
    })),

  resetarSimulacao: () =>
    set((s) => ({
      ...estadoInicial,
      mode: s.mode,
    })),
}));

function mensagemRejeicao(
  reason: 'kernel' | 'page-tables' | 'out-of-range' | 'in-use',
  frame: FrameNumber,
): string {
  switch (reason) {
    case 'kernel':
      return `Violação de proteção — quadro ${frame} pertence ao kernel.`;
    case 'page-tables':
      return `Quadro ${frame} é reservado para tabelas de páginas.`;
    case 'out-of-range':
      return `Quadro ${frame} fora da faixa de usuário (2..15).`;
    case 'in-use':
      return `Quadro ${frame} já está ocupado — use evicção.`;
  }
}

function replayTraducao(set: (partial: Partial<State>) => void, get: () => State & Actions) {
  const { resultadoMMU, processosV2 } = get();
  if (!resultadoMMU) return;
  const processo = processoPorId(processosV2, resultadoMMU.processId);
  const refeito = consultarMMU(processo, resultadoMMU.logical);
  set({ resultadoMMU: refeito });
}

function hex(n: number, width: number): string {
  return n.toString(16).padStart(width, '0').toUpperCase();
}

export function pendentePageFault(state: State): boolean {
  return pendingFault(state.resultadoMMU);
}

export function temFramesLivres(state: State): boolean {
  const { processosV2 } = state;
  for (let f = 2; f <= 15; f++) {
    if (frameOcupadoPor(processosV2, f as FrameNumber) === null) return true;
  }
  return false;
}

export function donoDoFrame(
  state: State,
  frame: FrameNumber,
): { processId: ProcessId; page: PageNumber } | null {
  return frameOcupadoPor(state.processosV2, frame);
}

export type { SwapSlot };
