import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  plugins: [
    glsl({
      compress: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: [
            'node_modules/monaco-editor/min',
            ...(env.command === 'serve' ? ['node_modules/monaco-editor/min-maps'] : [])
          ],
          dest: 'editor'
        },
        {
          src: ['node_modules/assemblyscript/dist/asc.js', 'node_modules/assemblyscript/dist/assemblyscript.js'],
          dest: 'asc'
        },
        {
          src: 'node_modules/binaryen/index.js',
          rename: 'binaryen.js',
          dest: 'asc'
        },
        {
          src: 'node_modules/long/index.js',
          rename: 'long.js',
          dest: 'asc'
        }
      ]
    }),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,

      pwaAssets: {},

      manifest: {
        id: 'io.github.hexacolonist',
        short_name: 'Hexacolonist',
        name: 'Hexacolonist',
        description: 'Bot programming game',
        display: 'minimal-ui',
        display_override: ['minimal-ui', 'standalone'],
        orientation: 'portrait',
        background_color: '#333333',
        theme_color: 'black',
        screenshots: [
          {
            src: 'screenshot-narrow.png',
            type: 'image/png',
            sizes: '520x720',
            form_factor: 'narrow'
          },
          {
            src: 'screenshot-wide.png',
            type: 'image/png',
            sizes: '720x520',
            form_factor: 'wide'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,ttf}'],
        globIgnores: ['**/vs/language/**'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module'
      }
    })
  ]
}))
