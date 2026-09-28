import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';

import type { Page } from '@playwright/test';

// Renders an original Vector preview.html with the original bundle, offline: every request to
// http://vector.test is answered from disk and anything else is aborted.
const ui = new URL('../../../../packages/ui/', import.meta.url);
const vendored = (path: string) => new URL(`visual/vector/${path}`, ui);
const fromUi = createRequire(new URL('package.json', ui));

interface Tok {
  name: string;
  value: string;
}
interface TokenJson {
  color: { tokens: Tok[] };
  type: { families: Record<string, string> };
  spacing: { tokens: Tok[] };
  radius: { tokens: Tok[] };
  shadow: { tokens: Tok[] };
  duration: { tokens: Tok[] };
  easing: { tokens: Tok[] };
}

// The :root variables the previews and bundle.css read (--bg-000, --space-6, --font-mono…),
// named exactly as in tokens.json. References such as {up} stay aliases.
function rootSheet(): string {
  const t = JSON.parse(readFileSync(new URL('tokens/tokens.json', ui), 'utf8')) as TokenJson;
  const ref = (v: string) => v.replace(/^\{(.+)\}$/, 'var(--$1)');
  const lines = [
    ...t.color.tokens,
    ...t.spacing.tokens,
    ...t.radius.tokens,
    ...t.shadow.tokens,
    ...t.duration.tokens,
    ...t.easing.tokens,
  ].map((x) => `--${x.name}: ${ref(x.value)};`);
  for (const [family, stack] of Object.entries(t.type.families))
    lines.push(`--font-${family}: ${stack};`);
  return `:root { ${lines.join(' ')} }`;
}

// The same Fontsource faces the app loads, with their files served from /fonts/.
const FACES = ['geist/400', 'geist/500', 'geist/600', 'geist-mono/400', 'geist-mono/500'];
const fontFiles = new Map<string, string>();
function fontSheet(): string {
  return FACES.map((face) => {
    const [pkg, weight] = face.split('/');
    const cssPath = fromUi.resolve(`@fontsource/${pkg}/${weight}.css`);
    return readFileSync(cssPath, 'utf8').replace(
      /url\(\.\/files\/([^)]+)\)/g,
      (_, file: string) => {
        fontFiles.set(file, join(dirname(cssPath), 'files', file));
        return `url(/fonts/${file})`;
      },
    );
  }).join('\n');
}

const bundleCss = () =>
  readFileSync(vendored('bundle.css'), 'utf8').replace(/^@import url\([^)]*\);\n/, '');

function page(name: string): string {
  const html = readFileSync(vendored(`previews/${name}.html`), 'utf8');
  const head = `<style>${fontSheet()}</style><style>${rootSheet()}</style><link rel="stylesheet" href="/bundle.css">`;
  const scripts =
    '<script src="/vendor/react.production.min.js"></script>' +
    '<script src="/vendor/react-dom.production.min.js"></script>' +
    '<script src="/bundle.js"></script>';
  return html.replace('<head>', `<head>${head}`).replace('<script>', `${scripts}<script>`);
}

/** Opens the original Vector preview of a component (by PascalCase name) in the page. */
export async function openVector(p: Page, name: string): Promise<void> {
  await p.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.host !== 'vector.test') return route.abort();
    const path = url.pathname;
    if (path === `/${name}.html`)
      return route.fulfill({ contentType: 'text/html', body: page(name) });
    if (path === '/bundle.css')
      return route.fulfill({ contentType: 'text/css', body: bundleCss() });
    if (path === '/bundle.js' || path.startsWith('/vendor/'))
      return route.fulfill({
        contentType: 'text/javascript',
        body: readFileSync(vendored(path.slice(1))),
      });
    const font = fontFiles.get(basename(path));
    if (path.startsWith('/fonts/') && font)
      return route.fulfill({ contentType: 'font/woff2', body: readFileSync(font) });
    return route.fulfill({ status: 404, body: '' });
  });
  await p.goto(`http://vector.test/${name}.html`);
}
