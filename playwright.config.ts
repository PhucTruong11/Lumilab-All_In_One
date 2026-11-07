import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (!process.env.CI && existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {}
}

const pythonBin = !process.env.CI && existsSync('apps/api/.venv/Scripts/python.exe')
  ? 'apps\\api\\.venv\\Scripts\\python.exe'
  : 'python';

const channel = process.env.PLAYWRIGHT_CHANNEL || (!process.env.CI && existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') ? 'chrome' : undefined);

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5175', channel, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  webServer: [
    { command: `"${pythonBin}" -m uvicorn lumilab_api.main:app --host 127.0.0.1 --port 8002 --no-access-log`, url: 'http://127.0.0.1:8002/' + (process.env.LUMILAB_DATABASE_URL ? 'ready' : 'health'), reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:web', url: 'http://127.0.0.1:5175', reuseExistingServer: !process.env.CI },
  ],
});
