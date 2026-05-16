import { describe, expect, it } from 'vitest';
import {
  acharSwapLivre,
  alocarPaginaEmFrame,
  consultarMMU,
  escreverSwap,
  frameOcupadoPor,
  framesUsuarioLivres,
  framesUsuarioOcupados,
  liberarSwap,
  setEntry,
  validarFrameAlvo,
} from './paging';
import { asFrame, asLogical, asPage, asSwapSlot, type ProcessV2, type SwapContent } from './types';

function processoTodoInvalido(): ProcessV2 {
  return {
    id: 'P1',
    ptbrOffset: 0x0000,
    pageTable: [
      { page: asPage(0), state: 'INV' },
      { page: asPage(1), state: 'INV' },
      { page: asPage(2), state: 'INV' },
      { page: asPage(3), state: 'INV' },
    ],
    variables: [],
  };
}

const swapVazia: (SwapContent | null)[] = Array.from({ length: 8 }, () => null);

describe('consultarMMU', () => {
  it('returns fault-invalid for INV pages', () => {
    const r = consultarMMU(processoTodoInvalido(), asLogical(0x0010));
    expect(r.kind).toBe('fault-invalid');
    if (r.kind === 'fault-invalid') {
      expect(r.page).toBe(0);
      expect(r.offset).toBe(0x010);
    }
  });

  it('returns fault-swap with slot when page is in swap', () => {
    const p = processoTodoInvalido();
    p.pageTable[1] = { page: asPage(1), state: 'SWAP', slot: asSwapSlot(18) };
    const r = consultarMMU(p, asLogical(0x0400));
    expect(r.kind).toBe('fault-swap');
    if (r.kind === 'fault-swap') {
      expect(r.slot).toBe(18);
      expect(r.page).toBe(1);
    }
  });

  it('translates normally when page is in RAM', () => {
    const p = processoTodoInvalido();
    p.pageTable[0] = { page: asPage(0), state: 'RAM', frame: asFrame(5) };
    const r = consultarMMU(p, asLogical(0x0010));
    expect(r.kind).toBe('translated');
    if (r.kind === 'translated') {
      expect(r.frame).toBe(5);
      expect(r.physical).toBe(5 * 1024 + 0x010);
      expect(r.steps.map((s) => s.kind)).toEqual([
        'decompose',
        'read-ptbr',
        'lookup-entry',
        'compute-physical',
      ]);
    }
  });
});

describe('validarFrameAlvo', () => {
  it('rejects the kernel frame', () => {
    const r = validarFrameAlvo([], asFrame(1));
    expect(r).toEqual({ ok: false, reason: 'kernel' });
  });

  it('rejects the page-tables frame', () => {
    const r = validarFrameAlvo([], asFrame(0));
    expect(r).toEqual({ ok: false, reason: 'page-tables' });
  });

  it('rejects frames outside the user range', () => {
    expect(validarFrameAlvo([], asFrame(-1)).ok).toBe(false);
    expect(validarFrameAlvo([], asFrame(16)).ok).toBe(false);
  });

  it('rejects frames already in use by another process', () => {
    const p = processoTodoInvalido();
    p.pageTable[0] = { page: asPage(0), state: 'RAM', frame: asFrame(5) };
    const r = validarFrameAlvo([p], asFrame(5));
    expect(r).toEqual({ ok: false, reason: 'in-use' });
  });

  it('accepts free user frames (2..15) that are not in use', () => {
    expect(validarFrameAlvo([], asFrame(2)).ok).toBe(true);
    expect(validarFrameAlvo([], asFrame(15)).ok).toBe(true);
  });
});

describe('frame inventory helpers', () => {
  it('lists free user frames excluding kernel and page tables', () => {
    const livres = framesUsuarioLivres([]);
    expect(livres).toHaveLength(14);
    expect(livres[0]).toBe(2);
    expect(livres[13]).toBe(15);
  });

  it('reports an occupied frame with its owner', () => {
    const p = processoTodoInvalido();
    p.pageTable[2] = { page: asPage(2), state: 'RAM', frame: asFrame(7) };
    expect(frameOcupadoPor([p], asFrame(7))).toEqual({ processId: 'P1', page: 2 });
    expect(frameOcupadoPor([p], asFrame(8))).toBeNull();
  });

  it('returns occupied frames as a list with owner info', () => {
    const p = processoTodoInvalido();
    p.pageTable[0] = { page: asPage(0), state: 'RAM', frame: asFrame(2) };
    p.pageTable[1] = { page: asPage(1), state: 'RAM', frame: asFrame(5) };
    const ocupados = framesUsuarioOcupados([p]);
    expect(ocupados).toEqual([
      { frame: 2, processId: 'P1', page: 0 },
      { frame: 5, processId: 'P1', page: 1 },
    ]);
  });
});

describe('swap helpers', () => {
  it('finds the first free swap slot (16..23)', () => {
    expect(acharSwapLivre(swapVazia)).toBe(16);
    const cheia = swapVazia.map(() => ({ processId: 'P1' as const, page: asPage(0) }));
    expect(acharSwapLivre(cheia)).toBeNull();
  });

  it('writes and frees swap slots immutably', () => {
    const escrito = escreverSwap(swapVazia, asSwapSlot(18), { processId: 'P2', page: asPage(3) });
    expect(swapVazia[2]).toBeNull();
    expect(escrito[2]).toEqual({ processId: 'P2', page: 3 });
    const livre = liberarSwap(escrito, asSwapSlot(18));
    expect(livre[2]).toBeNull();
  });
});

describe('setEntry / alocarPaginaEmFrame', () => {
  it('updates a single entry immutably', () => {
    const p = processoTodoInvalido();
    const next = setEntry([p], 'P1', asPage(2), {
      page: asPage(2),
      state: 'RAM',
      frame: asFrame(9),
    });
    expect(p.pageTable[2]).toEqual({ page: 2, state: 'INV' });
    expect(next[0]?.pageTable[2]).toEqual({ page: 2, state: 'RAM', frame: 9 });
  });

  it('allocates a page to a user frame', () => {
    const p = processoTodoInvalido();
    const next = alocarPaginaEmFrame([p], 'P1', asPage(0), asFrame(7));
    expect(next[0]?.pageTable[0]).toEqual({ page: 0, state: 'RAM', frame: 7 });
  });
});
