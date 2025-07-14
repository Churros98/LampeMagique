import withNuxt from './.nuxt/eslint.config.mjs';
import tseslint from 'typescript-eslint';

export default withNuxt(
  {
    files: ['**/*.{js,ts,vue}'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  }
);
