import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({ baseDirectory: fileURLToPath(new URL('.', import.meta.url)) });
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'work/**', 'outputs/**', 'src/generated/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // French prose uses literal apostrophes; React already escapes text nodes.
      'react/no-unescaped-entities': 'off'
    }
  }
];

export default config;
