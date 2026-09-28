import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/.next/',
    '**/next-env.d.ts',
    '**/playwright-report/',
    '**/test-results/',
    'packages/ui/visual/vector/',
  ]),
  ...nextVitals,
  ...nextTs,
  {
    files: ['{apps,packages}/*/src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: { parserOptions: { projectService: true } },
  },
  {
    settings: {
      // App Router only: points no-html-link-for-pages at the app, silencing "Pages directory cannot be found".
      next: { rootDir: 'apps/web/' },
      // Must be explicit: 'detect' calls context.getFilename(), removed in ESLint 10, and crashes lint.
      react: { version: '19.3' },
    },
  },
]);
