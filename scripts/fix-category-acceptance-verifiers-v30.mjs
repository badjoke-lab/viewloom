import fs from 'node:fs'

const path = 'scripts/verify-category-rollout-policy.mjs'
let source = fs.readFileSync(path, 'utf8')

const replacements = [
  [
    'Canonical target 12A-4-24 parallel execution',
    'Canonical target 12A-4-24 exact Kick release and Twitch seven-day audit',
  ],
  [
    'Earliest audit: `2026-07-27T11:40:00.000Z`',
    'Run the seven-day accumulation audit at or after `2026-07-27T11:40:00.000Z`',
  ],
  [
    "'${RELEASE_PACKAGE_MERGE}'",
    "'7afb81bb9098104107860e9fe6c920c7380964ad'",
  ],
  [
    "'${CONTROLS_PACKAGE_MERGE}'",
    "'aecd4a10ca0da3146c23e5841412603e1e4416dd'",
  ],
]

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`verifier fragment missing: ${before}`)
  source = source.replace(before, after)
}

fs.writeFileSync(path, source)
