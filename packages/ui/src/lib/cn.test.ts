import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('keeps a type style and a colour that share the text- prefix', () => {
    expect(cn('text-body', 'text-ink')).toBe('text-body text-ink');
  });

  it('resolves conflicts between Vector theme names, last one wins', () => {
    expect(cn('h-36px', 'h-28px')).toBe('h-28px');
    expect(cn('duration-fast', 'duration-base')).toBe('duration-base');
    expect(cn('grid-cols-funnel', 'grid-cols-main-auto')).toBe('grid-cols-main-auto');
    expect(cn('bg-up-soft px-7px', 'bg-transparent p-0')).toBe('bg-transparent p-0');
  });

  it('keeps an explicit line-height when a later class changes the size', () => {
    expect(cn('text-14px leading-20px', 'text-12px')).toBe('leading-20px text-12px');
  });
});
