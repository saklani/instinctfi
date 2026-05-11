// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // shadcn UI primitives ship cva variant exports alongside the component;
  // the same is true for our motion + provider primitives. Disable the
  // react-refresh rule for these files — fast-refresh is a dev-time concern,
  // and these export shapes are intentional design-system contracts.
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/motion/**/*.{ts,tsx}',
      'src/components/api-provider.tsx',
      '.storybook/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // TanStack Router file-based routes must export `Route` alongside their
  // component — the same react-refresh rule is structurally unfixable here.
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  ...storybook.configs["flat/recommended"],
])
