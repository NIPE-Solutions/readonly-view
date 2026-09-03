import { defineConfig } from 'vite';

export default defineConfig({
    root: 'website',
    base: './',
    build: { outDir: 'dist', emptyOutDir: true },
});
