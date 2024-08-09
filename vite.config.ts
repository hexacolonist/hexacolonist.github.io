import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    glsl({
      compress: true
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
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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
})
