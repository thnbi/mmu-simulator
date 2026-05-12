import { describe, expect, it } from 'vitest';
import { decomporEndereco } from './address';
import { asLogical } from './types';

describe('decomporEndereco', () => {
  it('decomposes 0x0000 into page 0 offset 0', () => {
    const r = decomporEndereco(asLogical(0x0000));
    expect(r.page).toBe(0);
    expect(r.offset).toBe(0);
  });

  it('decomposes 0x0400 into page 1 offset 0', () => {
    const r = decomporEndereco(asLogical(0x0400));
    expect(r.page).toBe(1);
    expect(r.offset).toBe(0);
  });

  it('decomposes 0x0CFF into page 3 offset 255', () => {
    const r = decomporEndereco(asLogical(0x0cff));
    expect(r.page).toBe(3);
    expect(r.offset).toBe(0xff);
  });

  it('throws on address >= virtual address space', () => {
    expect(() => decomporEndereco(asLogical(0x1000))).toThrow(/4096/);
  });

  it('throws on negative address', () => {
    expect(() => decomporEndereco(asLogical(-1))).toThrow(/-1/);
  });
});
