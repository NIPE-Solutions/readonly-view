import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    root: 'website',
    base: '/',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: resolve(import.meta.dirname, 'website/index.html'),
                privacy: resolve(
                    import.meta.dirname,
                    'website/privacy/index.html',
                ),
                impressum: resolve(
                    import.meta.dirname,
                    'website/impressum/index.html',
                ),
                datenschutz: resolve(
                    import.meta.dirname,
                    'website/de/datenschutz/index.html',
                ),
                'de-impressum': resolve(
                    import.meta.dirname,
                    'website/de/impressum/index.html',
                ),
            },
        },
    },
});
