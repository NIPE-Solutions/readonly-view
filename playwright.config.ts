import { defineConfig } from '@playwright/test';
import { release } from 'node:os';

const usesFrozenMacOs14WebKit =
    process.platform === 'darwin' && Number(release().split('.')[0]) <= 23;
const projects = [
    { name: 'chromium', use: { browserName: 'chromium' as const } },
    { name: 'firefox', use: { browserName: 'firefox' as const } },
    { name: 'webkit', use: { browserName: 'webkit' as const } },
].filter(({ name }) => !(usesFrozenMacOs14WebKit && name === 'webkit'));

export default defineConfig({
    testDir: './test/browser',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['line']] : 'line',
    use: { baseURL: 'http://127.0.0.1:4173', trace: 'on-first-retry' },
    projects,
    webServer: [
        {
            command: 'vite --host 127.0.0.1 --port 4173 --strictPort',
            port: 4173,
            reuseExistingServer: !process.env.CI,
        },
        {
            command:
                'npm run build:website && vite preview --config vite.website.config.ts --host 127.0.0.1 --port 42873 --strictPort',
            port: 42873,
            reuseExistingServer: !process.env.CI,
        },
    ],
});
