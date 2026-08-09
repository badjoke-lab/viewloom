import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

const pages = [
  'index.html','about/index.html','support/index.html','changelog/index.html','contact/index.html','terms/index.html','privacy/index.html','refund-policy/index.html','commercial-disclosure/index.html',
  'twitch/index.html','twitch/heatmap/index.html','twitch/day-flow/index.html','twitch/battle-lines/index.html','twitch/history/index.html','twitch/status/index.html',
  'kick/index.html','kick/heatmap/index.html','kick/day-flow/index.html','kick/battle-lines/index.html','kick/history/index.html','kick/status/index.html',
]
const providerExpectations = pages.map((path) => ({ path, provider: path.startsWith('twitch/') || path === 'twitch/index.html' ? 'twitch' : path.startsWith('kick/') || path === 'kick/index.html' ? 'kick' : 'portal' }))
const staticEntryContracts = ['about/index.html','support/index.html','contact/index.html','terms/index.html','privacy/index.html','refund-policy/index.html','commercial-disclosure/index.html'].map((path) => ({ path, entry: '/src/static-page.ts' }))
const liveEntryContracts = [
  { path:'changelog/index.html', entry:'/src/changelog-page.ts' },
  { path:'twitch/heatmap/index.html', entry:'/src/live/heatmap-current-shell-entry.ts' },
  { path:'kick/heatmap/index.html', entry:'/src/live/heatmap-current-shell-entry.ts' },
  { path:'twitch/day-flow/index.html', entry:'/src/live/day-flow-twitch-entry.ts' },
  { path:'kick/day-flow/index.html', entry:'/src/live/day-flow-current-shell-entry.ts' },
  { path:'twitch/battle-lines/index.html', entry:'/src/live/battle-lines-current-shell-entry.ts' },
  { path:'kick/battle-lines/index.html', entry:'/src/live/battle-lines-current-shell-entry.ts' },
  { path:'twitch/history/index.html', entry:'/src/live/history-current-shell-entry.ts' },
  { path:'kick/history/index.html', entry:'/src/live/history-current-shell-entry.ts' },
  { path:'twitch/status/index.html', entry:'/src/live/status-current-shell-entry.ts' },
  { path:'kick/status/index.html', entry:'/src/live/status-current-shell-entry.ts' },
]
const staticPaths = new Set(staticEntryContracts.map((contract) => contract.path))
const mockEntryPages = pages.filter((path) => !staticPaths.has(path))
const requiredShellFragments = ['<span class="brand-mark">VL</span>','class="masthead"','class="global-nav"','href="/twitch/"','href="/kick/"','href="/about/"','href="/support/"','class="page','class="breadcrumb"','class="footer"','/src/mock-site.css','/src/analytics.ts']
const requiredSourceFiles = [
  'vite.config.ts','src/mock-site.css','src/mock-site.ts','src/static-page.ts','src/legal-page.css','src/shared-shell.ts','src/changelog-page.ts','src/changelog-page.css',
  'src/live/heatmap-current-shell-entry.ts','src/live/twitch-heatmap.ts','src/live/heatmap-layout.ts','src/features/twitch-heatmap/canvas-scene.ts',
  'src/live/day-flow-current-shell-entry.ts','src/live/day-flow-twitch-entry.ts','src/live/day-flow-category-preview-entry.ts',
  'src/live/battle-lines-current-shell-entry.ts','src/live/history-current-shell-entry.ts','src/live/status-current-shell-entry.ts',
]
const forbiddenGlobalPatterns = [
  {label:'failed cutover runtime',pattern:/mock-cutover/},{label:'failed cutover plugin',pattern:/mockCutoverPlugin/},{label:'public redesign mock label',pattern:/redesign mock/i},{label:'public Portal mock label',pattern:/Portal mock/i},
  {label:'old fake Twitch live number',pattern:/>\s*287\s*</},{label:'old fake Twitch largest number',pattern:/118\.4K/},{label:'old fake Kick live number',pattern:/>\s*83\s*</},{label:'old fake Kick largest number',pattern:/42\.7K/},{label:'old fake observed total',pattern:/1\.86M observed/},{label:'old fake UTC observation timestamp',pattern:/12:40 UTC|12:25 UTC|11:55 UTC/},{label:'legacy heatmap grid shell',pattern:/class="heatmap-grid"/},
]
const forbiddenSourcePatterns = [
  {path:'src/mock-site.ts',label:'legacy static heatmap behavior',pattern:/data-selected-name|data-selected-viewers|data-selected-momentum/},
  {path:'src/live/twitch-heatmap.ts',label:'legacy renderer switch',pattern:/shouldUseCanvasRenderer/},
  {path:'src/live/twitch-heatmap.ts',label:'legacy DOM viewport',pattern:/createHeatmapViewport|heatmap-viewport-v2/},
  {path:'src/live/twitch-heatmap.ts',label:'legacy DOM tile renderer',pattern:/renderHeatmapShell|renderTile\(/},
  {path:'src/live/twitch-heatmap.ts',label:'legacy CSS transform renderer',pattern:/translate3d\(/},
  {path:'src/live/heatmap-layout.ts',label:'legacy layout storage',pattern:/localStorage|HEATMAP_RENDERER_KEY/},
  {path:'src/live/heatmap-layout.ts',label:'legacy layout renderer preference',pattern:/preferOfficialCanvasRenderer/},
  {path:'src/live/heatmap-layout.ts',label:'legacy DOM layout movement',pattern:/moveHeatmapSections|moveLegendForLayout|data-layout-mode/},
]
const removedHeatmapFiles = ['src/live/heatmap-viewport.ts','src/live/heatmap-viewport-v2.ts','src/live/heatmap-live-shell.ts','src/live/heatmap-treemap.ts','src/live/heatmap-inspector.ts']
const read = (path) => readFileSync(join(root,path),'utf8')
const requireFragments = (path,source,fragments) => { for (const fragment of fragments) if (!source.includes(fragment)) failures.push(`${path}: missing required production shell fragment: ${fragment}`) }
const forbidPatterns = (path,source,patterns) => { for (const {label,pattern} of patterns) if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`) }

for (const path of pages) if (!existsSync(join(root,path))) failures.push(`${path}: missing public page`)
for (const path of pages.filter((path)=>existsSync(join(root,path)))) { const source=read(path); requireFragments(path,source,requiredShellFragments); forbidPatterns(path,source,forbiddenGlobalPatterns) }
for (const path of mockEntryPages.filter((path)=>existsSync(join(root,path)))) if (!read(path).includes('/src/mock-site.ts')) failures.push(`${path}: missing production shell entry /src/mock-site.ts`)
for (const {path,provider} of providerExpectations) if (existsSync(join(root,path)) && !read(path).includes(`data-provider="${provider}"`)) failures.push(`${path}: expected data-provider="${provider}"`)
for (const {path,entry} of [...staticEntryContracts,...liveEntryContracts]) if (existsSync(join(root,path)) && !read(path).includes(entry)) failures.push(`${path}: missing production entry ${entry}`)
for (const {path} of staticEntryContracts) if (existsSync(join(root,path)) && read(path).includes('/src/mock-site.ts')) failures.push(`${path}: provider-neutral static page must not use mock-site.ts`)
for (const path of requiredSourceFiles) if (!existsSync(join(root,path))) failures.push(`${path}: missing required production source file`)
for (const path of requiredSourceFiles.filter((path)=>existsSync(join(root,path)))) forbidPatterns(path,read(path),forbiddenGlobalPatterns.slice(0,4))
for (const {path,label,pattern} of forbiddenSourcePatterns) if (existsSync(join(root,path)) && pattern.test(read(path))) failures.push(`${path}: contains forbidden ${label}`)

if (existsSync(join(root,'src/live/heatmap-layout.ts'))) requireFragments('src/live/heatmap-layout.ts',read('src/live/heatmap-layout.ts'),['export function initHeatmapLayout','Compatibility entry'])
for (const path of removedHeatmapFiles) if (existsSync(join(root,path))) failures.push(`${path}: legacy Heatmap file must not exist in production source`)
if (existsSync(join(root,'src/mock-cutover.css'))) failures.push('src/mock-cutover.css: must not exist')
if (existsSync(join(root,'src/mock-cutover.ts'))) failures.push('src/mock-cutover.ts: must not exist')

// Twitch Day Flow uses a provider-specific bootstrap so the Twitch-only public
// category layer installs before the existing single shared Day Flow controller.
if (existsSync(join(root,'src/live/day-flow-twitch-entry.ts'))) {
  const source = read('src/live/day-flow-twitch-entry.ts')
  requireFragments('src/live/day-flow-twitch-entry.ts',source,["import './day-flow-category-preview-entry'","void import('./day-flow-current-shell-entry')"])
  if (source.indexOf("import './day-flow-category-preview-entry'") > source.indexOf("void import('./day-flow-current-shell-entry')")) failures.push('src/live/day-flow-twitch-entry.ts: Twitch category layer must run before Day Flow shell')
}
if (existsSync(join(root,'src/live/day-flow-category-preview-entry.ts'))) {
  const source = read('src/live/day-flow-category-preview-entry.ts')
  requireFragments('src/live/day-flow-category-preview-entry.ts',source,[
    "const enabled = provider === 'twitch'",
    "root.dataset.dayflowCategoryPreview = 'public'",
    'aria-label="Twitch Day Flow category"',
    "filter.implementationState !== 'public'",
    'filter.publicExposureAuthorized !== true',
    'if (enabled) {',
  ])
  if (source.includes("initialUrl.searchParams.get(PREVIEW_PARAM) === '1'")) failures.push('src/live/day-flow-category-preview-entry.ts: public Twitch category UI must not require categoryPreview=1')
}

if (failures.length) { console.error('ViewLoom production source verification failed:'); for (const failure of failures) console.error(`- ${failure}`); process.exit(1) }
console.log(`ViewLoom production source verification passed for ${pages.length} public pages, ${staticEntryContracts.length} provider-neutral static entries, and ${liveEntryContracts.length} live entry contracts.`)
