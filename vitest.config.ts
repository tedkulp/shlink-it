import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WxtVitest wires up WXT's aliases (`@/`), auto-imports and a fake `browser`.
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    include: ['test/**/*.test.ts'],
  },
});
