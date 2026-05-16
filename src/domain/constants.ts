export const PAGE_SIZE = 1024;
export const RAM_FRAMES = 16;
export const PAGES_PER_PROCESS = 4;
export const FRAME_PAGE_TABLES = 0;
export const VIRTUAL_ADDRESS_SPACE = PAGE_SIZE * PAGES_PER_PROCESS;

// Part 2 — kernel protection and swap area
export const FRAME_KERNEL = 1;
export const USER_FRAME_MIN = 2;
export const USER_FRAME_MAX = 15;
export const SWAP_SLOT_MIN = 16;
export const SWAP_SLOT_MAX = 23;
export const SWAP_SLOTS = SWAP_SLOT_MAX - SWAP_SLOT_MIN + 1;
