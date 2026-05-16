export type ProcessId = 'P1' | 'P2' | 'P3';

export type PageNumber = number & { readonly __brand: 'PageNumber' };
export type FrameNumber = number & { readonly __brand: 'FrameNumber' };
export type Offset = number & { readonly __brand: 'Offset' };
export type LogicalAddress = number & { readonly __brand: 'LogicalAddress' };
export type PhysicalAddress = number & { readonly __brand: 'PhysicalAddress' };
export type SwapSlot = number & { readonly __brand: 'SwapSlot' };

export const asPage = (n: number): PageNumber => n as PageNumber;
export const asFrame = (n: number): FrameNumber => n as FrameNumber;
export const asOffset = (n: number): Offset => n as Offset;
export const asLogical = (n: number): LogicalAddress => n as LogicalAddress;
export const asPhysical = (n: number): PhysicalAddress => n as PhysicalAddress;
export const asSwapSlot = (n: number): SwapSlot => n as SwapSlot;

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

// Part 2 — page states and demand paging

export type PageState = 'INV' | 'RAM' | 'SWAP';

export type PageTableEntryV2 =
  | { page: PageNumber; state: 'INV' }
  | { page: PageNumber; state: 'RAM'; frame: FrameNumber }
  | { page: PageNumber; state: 'SWAP'; slot: SwapSlot };

export type ProcessV2 = {
  id: ProcessId;
  ptbrOffset: number;
  pageTable: PageTableEntryV2[];
  variables: LogicalAddress[];
};

export type SwapContent = {
  processId: ProcessId;
  page: PageNumber;
};

export type MMUResult =
  | {
      kind: 'translated';
      processId: ProcessId;
      logical: LogicalAddress;
      page: PageNumber;
      offset: Offset;
      frame: FrameNumber;
      physical: PhysicalAddress;
      steps: TranslationStep[];
    }
  | {
      kind: 'fault-invalid';
      processId: ProcessId;
      logical: LogicalAddress;
      page: PageNumber;
      offset: Offset;
    }
  | {
      kind: 'fault-swap';
      processId: ProcessId;
      logical: LogicalAddress;
      page: PageNumber;
      offset: Offset;
      slot: SwapSlot;
    };
