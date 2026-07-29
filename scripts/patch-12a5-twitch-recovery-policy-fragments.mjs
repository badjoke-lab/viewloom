import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

const roadmapPath = 'docs/product/current-roadmap.md'
let roadmap = readFileSync(roadmapPath, 'utf8')
const roadmapMarker = '### Current gate: replacement Twitch seven-day accumulation\n'
assert.ok(roadmap.includes(roadmapMarker))
const requiredHistory = [
  '- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.',
  '- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.',
  '- Kick dormant release package accepted in PR #641 and frozen canonically in PR #642.',
  '- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.',
  '- Kick permanent category capture started through PR #643, completed the minimum 24-hour observation, and was accepted in PR #648 without rollback.',
  '- The first Twitch seven-day audit was executed read-only in PR #651 and correctly rejected after detecting a production configuration regression.',
]
roadmap = roadmap.replace(roadmapMarker, `${requiredHistory.join('\n')}\n\n${roadmapMarker}`)
writeFileSync(roadmapPath, roadmap)

const schedulePath = 'docs/product/current-schedule.md'
let schedule = readFileSync(schedulePath, 'utf8')
const scheduleMarker = 'Kick permanent runtime active yes\n'
assert.ok(schedule.includes(scheduleMarker))
schedule = schedule.replace(
  scheduleMarker,
  `Kick permanent implementation package accepted yes\nKick permanent release package accepted yes\n${scheduleMarker}`,
)
writeFileSync(schedulePath, schedule)
