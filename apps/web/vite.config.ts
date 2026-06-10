import { defineConfig, loadEnv, type Plugin } from 'vite'

const GA4_MEASUREMENT_ID = 'G-YHX7HS1VBK'
const REDESIGN_TOKENS_HREF = '/src/redesign-tokens.css'
const SHARED_SHELL_SRC = '/src/mock-shell.ts'
const SHARED_PAGES_SRC = '/src/mock-pages.ts'

function googleSiteVerificationPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const verificationToken = env.VITE_GSC_VERIFICATION_TOKEN?.trim()

  return {
    name: 'viewloom-google-site-verification',
    transformIndexHtml(html) {
      if (!verificationToken) return html
      return html.replace(
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="google-site-verification" content="${escapeHtmlAttribute(verificationToken)}" />`,
      )
    },
  }
}

function googleTagPlugin(): Plugin {
  const tagUrl = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
  return {
    name: 'viewloom-google-tag',
    transformIndexHtml(html) {
      if (html.includes(tagUrl)) return html
      return html.replace(
        '  </head>',
        `    <script async src="${tagUrl}"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', '${GA4_MEASUREMENT_ID}');\n    </script>\n  </head>`,
      )
    },
  }
}

function redesignAssetsPlugin(): Plugin {
  return {
    name: 'viewloom-redesign-assets',
    transformIndexHtml(html) {
      let transformed = html
      if (!transformed.includes(REDESIGN_TOKENS_HREF)) {
        transformed = transformed.replace('  </head>', `    <link rel="stylesheet" href="${REDESIGN_TOKENS_HREF}" />\n  </head>`)
      }
      if (!transformed.includes(SHARED_SHELL_SRC)) {
        transformed = transformed.replace('  </body>', `    <script type="module" src="${SHARED_SHELL_SRC}"></script>\n  </body>`)
      }
      if (!transformed.includes(SHARED_PAGES_SRC)) {
        transformed = transformed.replace('  </body>', `    <script type="module" src="${SHARED_PAGES_SRC}"></script>\n  </body>`)
      }
      return transformed
    },
  }
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default defineConfig(({ mode }) => ({
  plugins: [googleSiteVerificationPlugin(mode), googleTagPlugin(), redesignAssetsPlugin()],
  server: { port: 4173 },
  build: {
    rollupOptions: {
      input: {
        portal: 'index.html',
        about: 'about/index.html',
        support: 'support/index.html',
        twitch: 'twitch/index.html',
        twitchHeatmap: 'twitch/heatmap/index.html',
        twitchDayFlow: 'twitch/day-flow/index.html',
        twitchBattleLines: 'twitch/battle-lines/index.html',
        twitchHistory: 'twitch/history/index.html',
        twitchStatus: 'twitch/status/index.html',
        kick: 'kick/index.html',
        kickHeatmap: 'kick/heatmap/index.html',
        kickDayFlow: 'kick/day-flow/index.html',
        kickBattleLines: 'kick/battle-lines/index.html',
        kickHistory: 'kick/history/index.html',
        kickStatus: 'kick/status/index.html',
      },
    },
  },
}))
