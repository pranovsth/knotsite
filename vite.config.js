import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { ignored: ['**/.sites-runtime/**', '**/.playwright-browsers/**', '**/.npm-cache/**', '**/inspection/**', '**/artifacts/**'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          if (id.includes('/gsap/')) return 'gsap'
        },
      },
    },
  },
})
