import { PAGE_SIZE, SWAP_SLOTS } from './constants';
import { asLogical, asPage, type ProcessV2, type SwapContent } from './types';

function variaveisPorPagina() {
  return [
    asLogical(0 * PAGE_SIZE + 0x010),
    asLogical(1 * PAGE_SIZE + 0x100),
    asLogical(2 * PAGE_SIZE + 0x2a0),
    asLogical(3 * PAGE_SIZE + 0x3f0),
  ];
}

function tabelaInvalida(): ProcessV2['pageTable'] {
  return [
    { page: asPage(0), state: 'INV' },
    { page: asPage(1), state: 'INV' },
    { page: asPage(2), state: 'INV' },
    { page: asPage(3), state: 'INV' },
  ];
}

export const processosIniciaisV2: ProcessV2[] = [
  {
    id: 'P1',
    ptbrOffset: 0x0000,
    pageTable: tabelaInvalida(),
    variables: variaveisPorPagina(),
  },
  {
    id: 'P2',
    ptbrOffset: 0x0100,
    pageTable: tabelaInvalida(),
    variables: variaveisPorPagina(),
  },
  {
    id: 'P3',
    ptbrOffset: 0x0200,
    pageTable: tabelaInvalida(),
    variables: variaveisPorPagina(),
  },
];

export const swapAreaInicial: (SwapContent | null)[] = Array.from(
  { length: SWAP_SLOTS },
  () => null,
);
