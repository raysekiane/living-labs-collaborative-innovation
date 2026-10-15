import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const configuredBase = loadEnv(mode, '.', 'VITE_').VITE_BASE_PATH ?? '/';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

  return {
    base,
    plugins: [react()],
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.mjs', 'tests/**/*.test.tsx'],
    },
  };
});
