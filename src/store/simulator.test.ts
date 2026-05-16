import { beforeEach, describe, expect, it } from 'vitest';
import { asFrame, asLogical } from '../domain/types';
import { useSimulatorStore } from './simulator';

describe('useSimulatorStore (Part 1)', () => {
  beforeEach(() => {
    useSimulatorStore.setState({ mode: 'part1' });
    useSimulatorStore.getState().resetarSimulacao();
  });

  it('starts with P1 active and no translation', () => {
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P1');
    expect(s.traducaoAtual).toBeNull();
  });

  it('selecionarProcesso changes active process and clears translation', () => {
    useSimulatorStore.getState().selecionarProcesso('P2');
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P2');
    expect(s.traducaoAtual).toBeNull();
  });

  it('acessarVariavel produces a translation for the active process', () => {
    useSimulatorStore.getState().acessarVariavel(asLogical(0x0400));
    const s = useSimulatorStore.getState();
    expect(s.traducaoAtual).not.toBeNull();
    expect(s.traducaoAtual?.frame).toBe(8);
  });

  it('resetarSimulacao restores initial state', () => {
    useSimulatorStore.getState().selecionarProcesso('P3');
    useSimulatorStore.getState().acessarVariavel(asLogical(0x0000));
    useSimulatorStore.getState().resetarSimulacao();
    const s = useSimulatorStore.getState();
    expect(s.processoAtivo).toBe('P1');
    expect(s.traducaoAtual).toBeNull();
  });
});

describe('useSimulatorStore (Part 2)', () => {
  beforeEach(() => {
    useSimulatorStore.getState().resetarSimulacao();
    useSimulatorStore.getState().setMode('part2');
  });

  it('starts with all pages INV and swap empty', () => {
    const s = useSimulatorStore.getState();
    expect(s.processosV2.every((p) => p.pageTable.every((e) => e.state === 'INV'))).toBe(true);
    expect(s.swapArea.every((slot) => slot === null)).toBe(true);
  });

  it('access to INV page raises fault-invalid', () => {
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    const r = useSimulatorStore.getState().resultadoMMU;
    expect(r?.kind).toBe('fault-invalid');
  });

  it('resolverFalta on fault-invalid allocates the page to the chosen frame', () => {
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    useSimulatorStore.getState().resolverFalta(asFrame(5));
    const s = useSimulatorStore.getState();
    expect(s.resultadoMMU?.kind).toBe('translated');
    const p1 = s.processosV2[0];
    if (!p1) throw new Error('P1 missing');
    expect(p1.pageTable[0]).toEqual({ page: 0, state: 'RAM', frame: 5 });
  });

  it('rejects mapping to the kernel frame with a violation event', () => {
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    useSimulatorStore.getState().resolverFalta(asFrame(1));
    const s = useSimulatorStore.getState();
    expect(s.resultadoMMU?.kind).toBe('fault-invalid');
    const last = s.eventos[s.eventos.length - 1];
    expect(last?.kind).toBe('violation');
  });

  it('eviction sends the victim to swap and allocates the new page to its frame', () => {
    // P1 page 0 → frame 5
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    useSimulatorStore.getState().resolverFalta(asFrame(5));
    // P1 page 1 → tries to allocate, but we pick the occupied frame 5 (eviction)
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0400));
    useSimulatorStore.getState().evictarEAlocar(asFrame(5));
    const s = useSimulatorStore.getState();
    const p1 = s.processosV2[0];
    if (!p1) throw new Error('P1 missing');
    expect(p1.pageTable[0]).toMatchObject({ state: 'SWAP' });
    expect(p1.pageTable[1]).toEqual({ page: 1, state: 'RAM', frame: 5 });
    expect(s.swapArea[0]).toEqual({ processId: 'P1', page: 0 });
  });

  it('swap-in faults reuse the freed swap slot', () => {
    // Allocate P1.pg0 → frame 5, then evict by allocating P1.pg1 to frame 5
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    useSimulatorStore.getState().resolverFalta(asFrame(5));
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0400));
    useSimulatorStore.getState().evictarEAlocar(asFrame(5));
    // Now P1.pg0 is in swap slot 16; re-accessing it triggers fault-swap, then swap-in to frame 6
    useSimulatorStore.getState().acessarVariavelV2(asLogical(0x0010));
    expect(useSimulatorStore.getState().resultadoMMU?.kind).toBe('fault-swap');
    useSimulatorStore.getState().resolverFalta(asFrame(6));
    const s = useSimulatorStore.getState();
    expect(s.resultadoMMU?.kind).toBe('translated');
    expect(s.swapArea[0]).toBeNull();
    const p1 = s.processosV2[0];
    if (!p1) throw new Error('P1 missing');
    expect(p1.pageTable[0]).toEqual({ page: 0, state: 'RAM', frame: 6 });
  });

  it('tentarMapearKernel always logs a violation', () => {
    useSimulatorStore.getState().tentarMapearKernel();
    const last = useSimulatorStore.getState().eventos.slice(-1)[0];
    expect(last?.kind).toBe('violation');
  });
});
