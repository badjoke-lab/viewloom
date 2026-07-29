import fs from 'node:fs'

const runnerPath = 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs'
const testPath = 'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs'

const replaceOnce = (source, before, after, label) => {
  const count = source.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`)
  return source.replace(before, after)
}

let runner = fs.readFileSync(runnerPath, 'utf8')
runner = replaceOnce(
  runner,
  `function queryTwitchWindow({ configPath, databaseName, startAt, endExclusiveAt }) {
  const start = sqlText(startAt)
  const end = sqlText(endExclusiveAt)
  return runD1Select(configPath, databaseName, \`
`,
  `function queryTwitchWindow({ configPath, databaseName, startAt, endExclusiveAt }) {
  return runD1Select(
    configPath,
    databaseName,
    buildTwitchWindowSql({ startAt, endExclusiveAt }),
  )
}

export function buildTwitchWindowSql({ startAt, endExclusiveAt }) {
  const start = sqlText(startAt)
  const end = sqlText(endExclusiveAt)
  return \`
`,
  'runner_header',
)
runner = replaceOnce(
  runner,
  `SELECT bucket_minute AS observed_bucket_minute
FROM scoped
WHERE category_contract_version = 'category-source-v1'
ORDER BY bucket_minute;`,
  `SELECT bucket_minute AS observed_bucket_minute
FROM minute_snapshots
WHERE provider = 'twitch'
  AND bucket_minute >= '\${start}'
  AND bucket_minute < '\${end}'
  AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'
ORDER BY bucket_minute;`,
  'slot_query',
)
runner = replaceOnce(
  runner,
  `LIMIT 1;
\`.trim())
}

function populateData`,
  `LIMIT 1;
\`.trim()
}

function populateData`,
  'runner_tail',
)
fs.writeFileSync(runnerPath, runner)

let test = fs.readFileSync(testPath, 'utf8')
test = replaceOnce(
  test,
  `  analyzeSlots,
  determineOutcome,
  resolveAuditWindow,`,
  `  analyzeSlots,
  buildTwitchWindowSql,
  determineOutcome,
  resolveAuditWindow,`,
  'test_import',
)
test = replaceOnce(
  test,
  `const contract = JSON.parse(
  fs.readFileSync('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json', 'utf8'),
)

const finalWindow`,
  `const contract = JSON.parse(
  fs.readFileSync('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json', 'utf8'),
)

const windowSql = buildTwitchWindowSql({
  startAt: contract.window.startAt,
  endExclusiveAt: contract.window.endExclusiveAt,
})
const statements = windowSql.split(';').map((statement) => statement.trim()).filter(Boolean)
assert.equal(statements.every((statement) => /^(SELECT|WITH)\\b/i.test(statement)), true)
const slotStatement = statements.find((statement) => statement.includes('observed_bucket_minute'))
assert.ok(slotStatement)
assert.ok(slotStatement.includes('FROM minute_snapshots'))
assert.ok(slotStatement.includes("provider = 'twitch'"))
assert.ok(slotStatement.includes("json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'"))
assert.equal(slotStatement.includes('FROM scoped'), false)
assert.equal(statements.slice(1).some((statement) => statement.includes('FROM scoped')), false)

const finalWindow`,
  'test_sql_scope',
)
test = replaceOnce(
  test,
  `  missingSlotAccounting: true,
  checkpointNonAuthorizing: true,`,
  `  sqlStatementScopeSafe: true,
  missingSlotAccounting: true,
  checkpointNonAuthorizing: true,`,
  'test_summary',
)
fs.writeFileSync(testPath, test)

console.log(JSON.stringify({
  ok: true,
  runnerPath,
  testPath,
  repair: 'sqlite_cte_scope_cross_statement',
}, null, 2))
