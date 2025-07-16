const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
  // Base ESLint recommended config
  eslint.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.test.json',
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...tseslint.configs.recommended.rules,
      
      // Custom rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
    }
  },
  
  // Ignore patterns
  {
    ignores: ['dist/**', 'coverage/**', '*.js', 'jest.config.js', 'eslint.config.js']
  }
];