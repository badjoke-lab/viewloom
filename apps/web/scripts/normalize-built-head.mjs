import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const measurementId = 'G-YHX7HS1VBK'
const tagUrl = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
const projectHubUrl = 'https://badjoke-lab.com/'
const verificationToken = process.env.VITE_GSC_VERIFICATION_TOKEN?.trim()

if (!existsSync(dist)) throw new Error('dist directory is missing.')

let normalized = 0
for (const path of htmlFiles(dist)) {
  let html = readFileSync(path, 'utf8')
  const original = html

  if (!html.includes(tagUrl)) {
    html = injectBeforeHeadClose(html, googleTagMarkup())
  }

  if (verificationToken && !html.includes('name="google-site-verification"')) {
    html = injectBeforeHeadClose(
      html,
      `<meta name="google-site-verification" content="${escapeHtmlAttribute(verificationToken)}" />`,
    )
  }

  if (/data-page=["'](?:twitch|kick)-channel["']/.test(html) && !/name=["']robots["']/.test(html)) {
    html = injectBeforeHeadClose(html, '<meta name="robots" content="noindex,follow" />')
  }

  if (/data-provider-home(?:\s|>)/.test(html) && !/<h1\b/i.test(html)) {
    const provider = html.match(/data-provider=["'](twitch|kick)["']/i)?.[1] ?? 'provider'
    const name = provider === 'twitch' ? 'Twitch' : provider === 'kick' ? 'Kick' : 'Provider'
    html = html.replace(
      /(<div\s+id=["']provider-home-root["'][^>]*>)/i,
      `$1<noscript><main><h1>${name} data</h1><p>JavaScript is required to load the current observed ${name} dashboard.</p></main></noscript>`,
    )
  }

  if (!html.includes(`href="${projectHubUrl}"`) && !html.includes(`href='${projectHubUrl}'`)) {
    html = injectProjectHubLink(html)
  }

  if (html !== original) {
    writeFileSync(path, html)
    normalized += 1
  }
}

writeDeploymentMetadata()
console.log(`Normalized built head metadata and project links in ${normalized} HTML file(s).`)

function htmlFiles(directory) {
  const result = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...htmlFiles(path))
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(path)
  }
  return result
}

function injectBeforeHeadClose(html, markup) {
  if (!/<\/head>/i.test(html)) throw new Error('Built HTML is missing a closing head tag.')
  return html.replace(/<\/head>/i, `${markup}\n</head>`)
}

function injectProjectHubLink(html) {
  const link = `<a href="${projectHubUrl}">BadJoke-Lab project hub</a>`
  const footerNavigation = /(<footer\b[\s\S]*?<nav\b[^>]*>)/i
  if (footerNavigation.test(html)) return html.replace(footerNavigation, `$1${link}`)
  if (/<\/footer>/i.test(html)) {
    return html.replace(/<\/footer>/i, `<p class="footer-project-hub">${link}</p></footer>`)
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `<footer class="footer footer-project-hub"><nav aria-label="Project network">${link}</nav></footer>\n</body>`)
  }
  throw new Error('Built HTML is missing a footer and closing body tag.')
}

function googleTagMarkup() {
  return `<script async src="${tagUrl}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${measurementId}');\n</script>`
}

function writeDeploymentMetadata() {
  const branch = process.env.CF_PAGES_BRANCH?.trim() || null
  const commitSha = process.env.CF_PAGES_COMMIT_SHA?.trim() || null
  const pagesUrl = process.env.CF_PAGES_URL?.trim() || null
  const environment = process.env.CF_PAGES === '1'
    ? branch === 'main' ? 'production' : 'preview'
    : 'local'
  const payload = {
    schema: 'viewloom-deployment-v1',
    generated_at: new Date().toISOString(),
    environment,
    branch,
    commit_sha: commitSha,
    pages_url: pagesUrl,
  }
  writeFileSync(join(dist, 'deployment.json'), `${JSON.stringify(payload, null, 2)}\n`)
}

function escapeHtmlAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
