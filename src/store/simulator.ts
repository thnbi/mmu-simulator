import { create } from 'zustand';
import { processosIniciais } from '../domain/initialState';
import { traduzirEndereco } from '../domain/mmu';
import type { LogicalAddress, Process, ProcessId, Translation } from '../domain/types';

type State = {
  processos: Process[];
  processoAtivo: ProcessId;
  traducaoAtual: Translation | null;
};

type Actions = {
  selecionarProcesso: (id: ProcessId) => void;
  acessarVariavel: (logical: LogicalAddress) => void;
  resetarSimulacao: () => void;
};

const estadoInicial: State = {
  processos: processosIniciais,
  processoAtivo: 'P1',
  traducaoAtual: null,
};

export const useSimulatorStore = create<State & Actions>((set, get) => ({
  ...estadoInicial,
  selecionarProcesso: (id) => set({ processoAtivo: id, traducaoAtual: null }),
  acessarVariavel: (logical) => {
    const { processos, processoAtivo } = get();
    const processo = processos.find((p) => p.id === processoAtivo);
    if (!processo) {
      throw new Error(
        `Processo ativo ${processoAtivo} não encontrado na lista de processos (ids: ${processos.map((p) => p.id).join(', ')})`,
      );
    }
    set({ traducaoAtual: traduzirEndereco(processo, logical) });
  },
  resetarSimulacao: () => set({ ...estadoInicial }),
}));
