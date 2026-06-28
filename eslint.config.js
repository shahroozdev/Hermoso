import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Client (React)
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Server (Node)
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-console': 'warn',
    },
  },

  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'client/dist/**',
      '**/*.config.*',
    ],
  },
);
