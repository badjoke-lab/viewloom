import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        portal: 'index.html',
        twitch: 'twitch/index.html',
        kick: 'kick/index.html',
      },
    },
  },
})
