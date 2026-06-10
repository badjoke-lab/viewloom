import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const root = process.cwd()

const publicPages = [
  'apps/web/index.html',
  'apps/web/about/index.html',
  'apps/web/support/index.html',
  'apps/web/twitch/index.html',
  'apps/web/twitch/heatmap/index.html',
  'apps/web/twitch/day-flow/index.html',
  'apps/web/twitch/battle-lines/index.html',
  'apps/web/twitch/history/index.html',
  'apps/web/twitch/status/index.html',
  'apps/web/kick/index.html',
  'apps/web/kick/heatmap/index.html',
  'apps/web/kick/day-flow/index.html',
  'apps/web/kick/battle-lines/index.html',
  'apps/web/kick/history/index.html',
  'apps/web/kick/status/index.html',
]

const requiredFiles = [
  ...publicPages,
  'apps/web/src/redesign-tokens.css',
  'apps/web/src/shared-shell.css',
  'apps/web/src/shared-shell.ts',
  'apps/web/src/shared/data-state.ts',
  'apps/web/src/shared-data-state.css',
  'apps/web/vite.config.ts',
  'docs/redesign/adopted-dark-redesign.md',
]

const requiredTokenValues = [
  '--vl-color-bg: #07111f',
  '--vl-color-bg-deep: #050b14',
  '--vl-color-text: #eef4ff',
  '--vl-color-muted: #9fb0ca',
  '--vl-color-portal: #2c97ff',
  '--vl-color-twitch: #905aff',
  '--vl-color-kick: #22d378',
  '--vl-color-battle-a: #7dd3fc',
  '--vl-color-battle-b: #f472b6',
  '--vl-color-battle-context: #8ea0bd',
]

const bannedRedesignTerms = [
  'Iowan Old Style',
  'Palatino Linotype',
  'font-family: Georgia',
  '--serif:',
  '--paper:',
]

const redesignSourceFiles = [
  'apps/web/src/redesign-tokens.css',
  'apps/web/src/shared-shell.css',
  'apps/web/src/shared-shell.ts',
  'apps/web/src/shared-data-state.css',
  'apps/web/src/shared/data-state.ts',
  'docs/redesign/adopted-dark-redesign.md',
]

const failures = []

for (const path of requiredFiles) {
  try {
    const info = await stat(resolve(root, path))
    if (!info.isFile()) failures.push(`${path}: expected a file`)
  } catch {
    failures.push(`${path}: missing`)
  }
}

const tokenCss = await readText('apps/web/src/redesign-tokens.css')
for (const token of requiredTokenValues) {
  if (!tokenCss.includes(token)) failures.push(`redesign-tokens.css: missing ${token}`)
}

const viteConfig = await readText('apps/web/vite.config.ts')
for (const page of publicPages) {
  const vitePath = page.replace('apps/web/', '')
  if (!viteConfig.includes(`'${vitePath}'`)) failures.push(`vite.config.ts: missing input ${vitePath}`)
}

for (const requiredReference of ['/src/redesign-tokens.css', '/src/shared-shell.ts']) {
  if (!viteConfig.includes(requiredReference)) failures.push(`vite.config.ts: missing ${requiredReference}`)
}

for (const path of redesignSourceFiles) {
  const content = await readText(path)
  for (const banned of bannedRedesignTerms) {
    if (content.includes(banned)) failures.push(`${path}: rejected redesign term found: ${banned}`)
  }
}

if (failures.length > 0) {
  console.error('ViewLoom redesign baseline check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`ViewLoom redesign baseline check passed (${publicPages.length} public pages).`)
}

async function readText(path) {
  try {
    return await readFile(resolve(root, path), 'utf8')
  } catch {
    return ''
  }
}
