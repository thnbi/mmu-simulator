# paging-simulator

Interactive visualization of how a CPU's Memory Management Unit (MMU) translates a process's logical addresses into physical RAM addresses through paging.

## Paging in one paragraph

In a paged virtual memory system, each process sees a flat, private address space split into fixed-size **pages**. Physical RAM is split into **frames** of the same size. The mapping from a process's pages to physical frames lives in a **page table** stored in memory. On every memory access the **MMU** consults this table to turn the logical address the process emitted into the physical address that actually reaches the RAM bus.

## What this simulator models

- **Page / frame size.** 1 KiB (1024 bytes).
- **Physical RAM.** 16 frames, numbered 0–15. Frame 0 is reserved to hold the page tables of every process; user data never lives there.
- **Processes.** Three processes (P1, P2, P3) share the same RAM. Each has its own logical address space of 4 pages (4 KiB total) and its own page table.
- **PTBR.** Every process's TCB stores a Page Table Base Register offset that points to the start of that process's table inside frame 0.
- **Variables.** Each process has four variables, one per page, placed at distinct offsets so the offset bits are visible in every translation.

## Anatomy of a translation

Click a variable. The MMU panel runs through the four hardware steps:

1. **Address decomposition.** The 12-bit logical address is split into a 2-bit page number (top bits) and a 10-bit offset (low bits).
2. **PTBR read.** The MMU reads the active process's PTBR from the TCB to locate its page table inside frame 0.
3. **Page table lookup.** The MMU indexes the table by the page number and reads the corresponding frame number.
4. **Physical address.** `physical = frame × 1024 + offset`. That number is sent to RAM.

Three arrows show the flow live: the variable points at *decompose*, the *read-PTBR* step points at frame 0 (where the page tables live), and the *compute* step points at the destination frame, which pulses to show the access.

## What the panels show

- **Processes.** P1, P2, P3 with their PTBR offset and TCB. Click a process to make it active; click any of its four variables to translate that variable's address.
- **MMU.** The four translation steps and the resulting physical address.
- **RAM.** All 16 frames, colored by owner (neutral for free frames; frame 0 is highlighted as the page-table area). The destination frame pulses on access; frame 0 also pulses, ringed in the active process's color, to show the page table being consulted first.
