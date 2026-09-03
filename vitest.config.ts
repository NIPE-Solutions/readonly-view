import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
        },
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    include: [
                        'test/unit/**/*.test.ts',
                        'test/integration/**/*.test.ts',
                        'test/regression/**/*.test.ts',
                    ],
                    setupFiles: ['test/setup.ts'],
                },
            },
        ],
    },
});
