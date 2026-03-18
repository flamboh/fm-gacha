/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'convex',
          include: ['convex/**/*.test.{ts,js}'],
          environment: 'edge-runtime',
        },
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['**/*.test.{ts,tsx,js,jsx}'],
          exclude: ['convex/**'],
          environment: 'jsdom',
        },
      },
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
})

export default config
