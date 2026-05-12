import { describe, expect, it } from 'vitest';
import { traduzirEndereco } from './mmu';
import { asFrame, asLogical, asPage, type Process } from './types';

const p1: Process = {
  id: 'P1',
  ptbrOffset: 0x0000,
  pageTable: [
    { page: asPage(0), frame: asFrame(5) },
    { page: asPage(1), frame: asFrame(8) },
    { page: asPage(2), frame: asFrame(9) },
    { page: asPage(3), frame: asFrame(11) },
  ],
  variables: [asLogical(0x0000), asLogical(0x0400), asLogical(0x0800), asLogical(0x0c00)],
};

describe('traduzirEndereco', () => {
  it('translates P1 variable on page 0 to frame 5', () => {
    const t = traduzirEndereco(p1, asLogical(0x0000));
    expect(t.frame).toBe(5);
    expect(t.physical).toBe(5 * 1024 + 0);
  });

  it('translates P1 variable on page 3 to frame 11', () => {
    const t = traduzirEndereco(p1, asLogical(0x0c00));
    expect(t.frame).toBe(11);
    expect(t.physical).toBe(11 * 1024);
  });

  it('returns 4 steps in order: decompose, read-ptbr, lookup-entry, compute-physical', () => {
    const t = traduzirEndereco(p1, asLogical(0x0400));
    expect(t.steps.map((s) => s.kind)).toEqual([
      'decompose',
      'read-ptbr',
      'lookup-entry',
      'compute-physical',
    ]);
  });

  it('throws when page is not in process page table', () => {
    const broken: Process = { ...p1, pageTable: [] };
    expect(() => traduzirEndereco(broken, asLogical(0x0000))).toThrow(/página 0/i);
  });
});
