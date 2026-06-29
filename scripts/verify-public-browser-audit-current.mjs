import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const required = [
  ['docs/product/current-roadmap.md', ['Phase 8 P8B complete PR #428', 'Phase 10 U10A active', 'work-quality-u10a-baseline']],
  ['docs/product/current-schedule.md', ['Phase 8 inventory/browser audit          complete PR #428', 'U10A defect and ownership baseline       active']],
  ['docs/product/post-watchlist-program-plan.md', ['Phase 8 inventory/browser audit complete PR #428', 'Current phase: Phase 10 — U10A defect and ownership baseline active']],
  ['docs/README.md', ['Phase 10 U10A quality baseline                   active', 'Active implementation branch                    work-quality-u10a-baseline']],
]
const issues = []
for (const [path, fragments] of required) {
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}
console.log('P8B current-state handoff verification passed.')
