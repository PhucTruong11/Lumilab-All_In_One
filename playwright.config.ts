import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5175', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  webServer: [
    { command: 'python -m uvicorn lumilab_api.main:app --host 127.0.0.1 --port 8002 --no-access-log', url: 'http://127.0.0.1:8002/' + (process.env.LUMILAB_DATABASE_URL ? 'ready' : 'health'), reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:web', url: 'http://127.0.0.1:5175', reuseExistingServer: !process.env.CI },
  ],
});
