import { beforeEach, describe, expect, it } from 'vitest';
import { asLogical } from '../domain/types';
import { useSimulatorStore } from './simulator';

describe('useSimulatorStore', () => {
  beforeEach(() => {
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
