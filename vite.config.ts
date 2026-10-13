import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'

// Plugin to copy manifest.json and fix manager path
function extensionPlugin() {
  return {
    name: 'chrome-extension',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, 'dist')

      // Copy manifest.json
      fs.copyFileSync(
        path.resolve(import.meta.dirname, 'manifest.json'),
        path.join(distDir, 'manifest.json')
      )

      // Move manager HTML to correct location. Vite computes the asset paths
      // inside it (e.g. "../../assets/...") relative to its ORIGINAL nested
      // location (dist/src/manager/index.html, two levels below dist/).
      // Moving the file up to dist/manager/index.html (one level below
      // dist/) without rewriting those paths leaves them pointing one
      // directory too high, outside dist/ entirely — so the manager page's
      // JS/CSS silently fail to load. Rewrite "../../" -> "../" to match the
      // file's new, shallower location.
      const srcHtml = path.join(distDir, 'src/manager/index.html')
      const destHtml = path.join(distDir, 'manager/index.html')
      if (fs.existsSync(srcHtml)) {
        fs.mkdirSync(path.join(distDir, 'manager'), { recursive: true })
        const html = fs.readFileSync(srcHtml, 'utf-8').replaceAll('../../', '../')
        fs.writeFileSync(destHtml, html)
        fs.rmSync(path.join(distDir, 'src'), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), extensionPlugin()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        manager: path.resolve(import.meta.dirname, 'src/manager/index.html'),
        background: path.resolve(import.meta.dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js'
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
