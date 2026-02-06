import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/tests/e2e',
  webServer: {
    command: 'npm run dev -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:4173'
  }
});
