import { PAGE_SIZE } from './constants';
import { asFrame, asLogical, asPage, type Process } from './types';

function variaveisPorPagina(): ReturnType<typeof asLogical>[] {
  return [
    asLogical(0 * PAGE_SIZE),
    asLogical(1 * PAGE_SIZE),
    asLogical(2 * PAGE_SIZE),
    asLogical(3 * PAGE_SIZE),
  ];
}

export const processosIniciais: Process[] = [
  {
    id: 'P1',
    ptbrOffset: 0x0000,
    pageTable: [
      { page: asPage(0), frame: asFrame(5) },
      { page: asPage(1), frame: asFrame(8) },
      { page: asPage(2), frame: asFrame(9) },
      { page: asPage(3), frame: asFrame(11) },
    ],
    variables: variaveisPorPagina(),
  },
  {
    id: 'P2',
    ptbrOffset: 0x0100,
    pageTable: [
      { page: asPage(0), frame: asFrame(1) },
      { page: asPage(1), frame: asFrame(2) },
      { page: asPage(2), frame: asFrame(12) },
      { page: asPage(3), frame: asFrame(13) },
    ],
    variables: variaveisPorPagina(),
  },
  {
    id: 'P3',
    ptbrOffset: 0x0200,
    pageTable: [
      { page: asPage(0), frame: asFrame(3) },
      { page: asPage(1), frame: asFrame(4) },
      { page: asPage(2), frame: asFrame(14) },
      { page: asPage(3), frame: asFrame(15) },
    ],
    variables: variaveisPorPagina(),
  },
];
