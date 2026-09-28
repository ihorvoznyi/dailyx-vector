import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildTokens } from '../scripts/build-tokens';
import extend from '../tokens/extend.json';
import source from '../tokens/tokens.json';
import { tokens } from './tokens';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const theme = read('./styles/theme.css');

// `--name: value;` lines of the @theme block. The `--color-*: initial;` resets don't match.
const declared = new Map(
  [...theme.matchAll(/^ {2}(--[\w-]+): (.+);$/gm)].map(([, name = '', value = '']) => [
    name,
    value,
  ]),
);

// Follows var(--x) aliases in theme.css down to a literal value.
const resolveCss = (name: string): string | undefined => {
  const value = declared.get(name);
  const alias = value === undefined ? undefined : /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  return alias === undefined ? value : resolveCss(alias);
};

// Follows {name} references in tokens.json down to a literal value.
const resolveJson = (value: string): string => {
  const ref = /^\{(.+)\}$/.exec(value)?.[1];
  const target = source.color.tokens.find((t) => t.name === ref);
  return target === undefined ? value : resolveJson(target.value);
};

const strip = (name: string, prefix: string) =>
  name.startsWith(prefix) ? name.slice(prefix.length) : name;

const scale = (list: { name: string; value: string }[], prefix: string) =>
  Object.fromEntries(list.map((t) => [strip(t.name, prefix), resolveJson(t.value)]));

// extend.json names are used verbatim.
const own = (list: { name: string; value: string }[]) =>
  Object.fromEntries(list.map((t) => [t.name, t.value]));

const styles = source.type.groups.flatMap((g) => g.styles.map((s) => ({ family: g.family, ...s })));

// The naming contract: tokens.json and extend.json names → theme variable and tokens.ts key.
const expected = {
  color: { ...scale(source.color.tokens, ''), ...own(extend.color.tokens) },
  spacing: { ...scale(source.spacing.tokens, 'space-'), ...own(extend.spacing.tokens) },
  radius: { ...scale(source.radius.tokens, 'radius-'), ...own(extend.radius.tokens) },
  shadow: { ...scale(source.shadow.tokens, 'shadow-'), ...own(extend.shadow.tokens) },
  dropShadow: own(extend.dropShadow.tokens),
  font: source.type.families,
  text: Object.fromEntries(
    styles.map((s) => [
      s.name,
      {
        family: s.family,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        fontWeight: s.fontWeight,
        letterSpacing: 'letterSpacing' in s ? s.letterSpacing : undefined,
      },
    ]),
  ),
  fontSize: own(extend.fontSize.tokens),
  leading: own(extend.leading.tokens),
  tracking: own(extend.tracking.tokens),
  duration: { ...scale(source.duration.tokens, 'dur-'), ...own(extend.duration.tokens) },
  ease: scale(source.easing.tokens, 'ease-'),
  breakpoint: own(extend.breakpoint.tokens),
  gridCols: own(extend.gridCols.tokens),
};

const vars = (namespace: string, values: Record<string, string>) =>
  Object.entries(values).map(([key, value]): [string, string] => [`--${namespace}-${key}`, value]);

describe('token pipeline', () => {
  it('committed theme.css and tokens.ts equal a fresh generation from the token sources', () => {
    const generated = buildTokens(source, extend);
    expect(generated.css).toBe(theme);
    expect(generated.ts).toBe(read('./tokens.ts'));
  });

  it('every theme variable and tokens.ts value resolves to its source value', () => {
    const expectedCss = new Map<string, string | undefined>([
      ['--spacing-0', '0px'],
      ...vars('color', expected.color),
      ...vars('spacing', expected.spacing),
      ...vars('radius', expected.radius),
      ...vars('shadow', expected.shadow),
      ...vars('drop-shadow', expected.dropShadow),
      ...vars('font', expected.font),
      ...styles.flatMap((s): [string, string][] => [
        [`--text-${s.name}`, s.fontSize],
        [`--text-${s.name}--line-height`, s.lineHeight],
        [`--text-${s.name}--font-weight`, String(s.fontWeight)],
        ...('letterSpacing' in s
          ? [[`--text-${s.name}--letter-spacing`, s.letterSpacing] as [string, string]]
          : []),
      ]),
      ...vars('text', expected.fontSize),
      ...vars('leading', expected.leading),
      ...vars('tracking', expected.tracking),
      ...vars('transition-duration', expected.duration),
      ...vars('ease', expected.ease),
      ...vars('breakpoint', expected.breakpoint),
      ...vars('grid-template-columns', expected.gridCols),
    ]);
    const actualCss = new Map([...declared.keys()].map((name) => [name, resolveCss(name)]));

    expect(actualCss).toEqual(expectedCss);
    expect(tokens).toEqual(expected);
  });

  it('refuses an extend.json name that redefines a token', () => {
    const clash = { ...extend, spacing: { tokens: [{ name: '4', value: '15px' }] } };
    expect(() => buildTokens(source, clash)).toThrow('spacing "4" already exists');
  });

  it('keeps tokens.json references as var() aliases', () => {
    for (const t of source.color.tokens) {
      const ref = /^\{(.+)\}$/.exec(t.value)?.[1];
      if (ref !== undefined) expect(declared.get(`--color-${t.name}`)).toBe(`var(--color-${ref})`);
    }
  });
});
