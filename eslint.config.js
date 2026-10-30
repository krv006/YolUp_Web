import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const SOURCE = '**/*.{js,jsx,ts,tsx}'
const ZOD = { name: 'zod', message: "zod'ni '@/shared/lib/zod' orqali import qiling: u jitless rejimini yoqadi (CSP unsafe-eval)." }

export default defineConfig([
  globalIgnores(['dist', 'src/shared/ui/*.tsx', 'src/shared/hooks/use-mobile.ts']),
  {
    files: [SOURCE],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    files: [`src/shared/${SOURCE}`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/pages/**', '@/widgets/**', '@/modules/**'],
          message: 'Shared qatlam yuqoridagi hech bir qatlamga bog‘lanmasligi kerak.',
        }],
        paths: [ZOD],
      }],
    },
  },
  {
    files: [`src/modules/${SOURCE}`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/pages/**', '@/widgets/**'],
          message: 'Domain modul app, page yoki widget qatlamini import qilmasligi kerak.',
        }],
        paths: [ZOD],
      }],
    },
  },
  {
    files: [`src/widgets/${SOURCE}`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/pages/**'],
          message: 'Widget app yoki page qatlamini import qilmasligi kerak.',
        }],
        paths: [ZOD],
      }],
    },
  },
  {
    files: [`src/app/${SOURCE}`, `src/pages/${SOURCE}`],
    rules: {
      'no-restricted-imports': ['error', { paths: [ZOD] }],
    },
  },
  {
    files: ['src/shared/lib/zod.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])
