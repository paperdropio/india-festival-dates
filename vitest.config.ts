import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Astronomy searches are CPU-bound; a couple of workers is plenty.
    poolOptions: { threads: { maxThreads: 2, minThreads: 1 } },
    testTimeout: 30000,
  },
});
