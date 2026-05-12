export type ProcessId = 'P1' | 'P2' | 'P3';

export type PageNumber = number & { readonly __brand: 'PageNumber' };
export type FrameNumber = number & { readonly __brand: 'FrameNumber' };
export type Offset = number & { readonly __brand: 'Offset' };
export type LogicalAddress = number & { readonly __brand: 'LogicalAddress' };
export type PhysicalAddress = number & { readonly __brand: 'PhysicalAddress' };

export const asPage = (n: number): PageNumber => n as PageNumber;
export const asFrame = (n: number): FrameNumber => n as FrameNumber;
export const asOffset = (n: number): Offset => n as Offset;
export const asLogical = (n: number): LogicalAddress => n as LogicalAddress;
export const asPhysical = (n: number): PhysicalAddress => n as PhysicalAddress;

export type PageTableEntry = {
  page: PageNumber;
  frame: FrameNumber;
};

export type Process = {
  id: ProcessId;
  ptbrOffset: number;
  pageTable: PageTableEntry[];
  variables: LogicalAddress[];
};

export type TranslationStep =
  | { kind: 'decompose'; logical: LogicalAddress; page: PageNumber; offset: Offset }
  | { kind: 'read-ptbr'; processId: ProcessId; ptbrOffset: number }
  | { kind: 'lookup-entry'; page: PageNumber; frame: FrameNumber }
  | { kind: 'compute-physical'; frame: FrameNumber; offset: Offset; physical: PhysicalAddress };

export type Translation = {
  logical: LogicalAddress;
  physical: PhysicalAddress;
  frame: FrameNumber;
  steps: TranslationStep[];
};
