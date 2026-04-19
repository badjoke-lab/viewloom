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
        twitchHeatmap: 'twitch/heatmap/index.html',
        twitchDayFlow: 'twitch/day-flow/index.html',
        twitchBattleLines: 'twitch/battle-lines/index.html',
        kick: 'kick/index.html',
        kickHeatmap: 'kick/heatmap/index.html',
        kickDayFlow: 'kick/day-flow/index.html',
        kickBattleLines: 'kick/battle-lines/index.html',
      },
    },
  },
})
