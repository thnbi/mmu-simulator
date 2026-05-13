import type { ProcessId } from '../domain/types';

type ProcessColor = {
  bg: string;
  bgSoft: string;
  border: string;
  text: string;
  chip: string;
  stroke: string; // CSS color for SVG strokes
};

export const PROCESS_COLORS: Record<ProcessId, ProcessColor> = {
  P1: {
    bg: 'bg-primary-500',
    bgSoft: 'bg-primary-100-900',
    border: 'border-primary-500',
    text: 'text-primary-700-300',
    chip: 'preset-filled-primary-500',
    stroke: 'var(--color-primary-500)',
  },
  P2: {
    bg: 'bg-success-500',
    bgSoft: 'bg-success-100-900',
    border: 'border-success-500',
    text: 'text-success-700-300',
    chip: 'preset-filled-success-500',
    stroke: 'var(--color-success-500)',
  },
  P3: {
    bg: 'bg-warning-500',
    bgSoft: 'bg-warning-100-900',
    border: 'border-warning-500',
    text: 'text-warning-700-300',
    chip: 'preset-filled-warning-500',
    stroke: 'var(--color-warning-500)',
  },
};

export function coresDoProcesso(id: ProcessId): ProcessColor {
  return PROCESS_COLORS[id];
}
