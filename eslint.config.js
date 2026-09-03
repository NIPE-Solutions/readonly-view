import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'coverage/**',
            'dist/**',
            'node_modules/**',
            'website/dist/**',
            'src/**',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ['**/*.ts'],
    })),
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: { globals: globals.node },
    },
);
