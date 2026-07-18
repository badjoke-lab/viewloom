from pathlib import Path
import json


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f'{label}: exact source not found')
    return source.replace(old, new, 1)


runner_path = Path('scripts/run-12a4-twitch-category-capture-canary-execution.mjs')
runner = runner_path.read_text()

old_run_command = """function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}
"""
new_run_command = """function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  const stdout = String(result.stdout ?? '').trim()
  const stderr = String(result.stderr ?? '').trim()
  return {
    code: result.status ?? 1,
    stdout,
    stderr,
    output: [stdout, stderr].filter(Boolean).join('\n'),
  }
}
"""
runner = replace_once(runner, old_run_command, new_run_command, 'runCommand')
runner = replace_once(
    runner,
    'const parsed = parseLastJson(result.output)',
    'const parsed = parseLastJson(result.stdout || result.output)',
    'stdout parser input',
)

parser_start = runner.index('function parseLastJson(output) {')
parser_end = runner.index('\n\nfunction flattenD1Rows', parser_start)
parser_replacement = r'''export function parseLastJson(output) {
  const source = stripAnsi(String(output ?? '')).trim()
  if (!source) throw new Error('wrangler_json_output_missing')

  for (let start = 0; start < source.length; start += 1) {
    const opening = source[start]
    if (opening !== '[' && opening !== '{') continue

    const stack = []
    let inString = false
    let escaped = false

    for (let index = start; index < source.length; index += 1) {
      const character = source[index]

      if (inString) {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') inString = false
        continue
      }

      if (character === '"') {
        inString = true
        continue
      }
      if (character === '{' || character === '[') {
        stack.push(character)
        continue
      }
      if (character !== '}' && character !== ']') continue

      const expectedOpening = character === '}' ? '{' : '['
      if (stack.at(-1) !== expectedOpening) break
      stack.pop()
      if (stack.length !== 0) continue

      const candidate = source.slice(start, index + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        break
      }
    }
  }

  throw new Error('wrangler_json_output_missing')
}

function stripAnsi(value) {
  return String(value ?? '').replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}'''
runner = runner[:parser_start] + parser_replacement + runner[parser_end:]
runner_path.write_text(runner)

fixture_path = Path('scripts/test-12a4-twitch-category-capture-canary-execution.mjs')
fixture = fixture_path.read_text()
if '  parseLastJson,\n' not in fixture:
    fixture = replace_once(
        fixture,
        '  generatedCanaryConfigPath,\n',
        '  generatedCanaryConfigPath,\n  parseLastJson,\n',
        'fixture import',
    )
fixture_marker = "const template = fs.readFileSync('workers/collector-twitch/wrangler.category-canary.toml', 'utf8')"
parser_fixture = r'''const noisyWranglerOutput = `\u001b[90mwrangler informational prefix\u001b[0m
[{"results":[{"provider_leakage_rows":0,"category_payload_rows":12}],"success":true}]
warning emitted after the JSON payload`
const parsedNoisyWranglerOutput = parseLastJson(noisyWranglerOutput)
assert.equal(parsedNoisyWranglerOutput[0].results[0].provider_leakage_rows, 0)
assert.equal(parsedNoisyWranglerOutput[0].results[0].category_payload_rows, 12)
assert.throws(() => parseLastJson('wrangler output without JSON'), /wrangler_json_output_missing/)

'''
if 'const noisyWranglerOutput =' not in fixture:
    fixture = replace_once(fixture, fixture_marker, parser_fixture + fixture_marker, 'fixture insertion')
fixture_path.write_text(fixture)

verifier_path = Path('scripts/verify-12a4-twitch-category-capture-canary-execution-package.mjs')
verifier = verifier_path.read_text()
verifier_checks = """assert.ok(runner.includes('export function parseLastJson'))
assert.ok(runner.includes("const stdout = String(result.stdout ?? '').trim()"))
assert.ok(runner.includes('parseLastJson(result.stdout || result.output)'))
assert.ok(fixture.includes('const noisyWranglerOutput ='))
assert.ok(fixture.includes('wrangler_json_output_missing'))

"""
if "assert.ok(runner.includes('export function parseLastJson'))" not in verifier:
    verifier = replace_once(verifier, 'console.log(JSON.stringify({', verifier_checks + 'console.log(JSON.stringify({', 'verifier insertion')
verifier_path.write_text(verifier)

contract_path = Path('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
contract = json.loads(contract_path.read_text())
contract['attempt2MonitorFailure'] = {
    'workflowRunId': 29629390710,
    'workflowJobId': 88040007930,
    'artifactId': 8424948287,
    'artifactDigest': 'sha256:cf2ff1038ea4f51ec7d378fcba9e0503090afefa2ac0f831931dfeee43d06ed8',
    'observedAt': '2026-07-18T03:46:13.424Z',
    'error': 'wrangler_json_output_missing',
    'failureClass': 'monitor_output_parser',
    'storagePass': True,
    'providerCurrentMb': 320.45,
    'projectedNinetyDaySizeMb': 368.77,
    'projectedProviderHeadroomMb': 81.23,
    'projectedAccountWideHeadroomMb': 882.78,
    'bindingsMatchedAttemptBeforeMonitor': True,
    'rollbackExitCode': 0,
    'rollbackPass': True,
    'canaryBindingsAbsentAfterRollback': True,
    'permanentDirectFlagPresentAfterRollback': False,
    'boundedRuntimeCaptureActiveAfterRollback': False,
    'productionRuntimeCaptureAuthorizedBeyondCanary': False,
    'kickChanged': False,
}
contract.setdefault('acceptance', {})['monitorParserFixPendingPrAcceptance'] = True
contract['nextGate'] = 'accept the monitor JSON parser fix, verify the normal Twitch collector through the next start-job read-only preflight, then use a separate exact one-file trigger for a new bounded attempt'
contract_path.write_text(json.dumps(contract, indent=2) + '\n')

wip_path = Path('docs/work-in-progress/phase12a4-twitch-category-capture-canary-execution.md')
wip = wip_path.read_text()
section = '''

## Attempt 2 monitor failure and rollback

Attempt 2 started successfully after the exact start boundary and fresh read-only preflight. The first scheduled monitor run `29629390710` failed while parsing Wrangler D1 JSON output with `wrangler_json_output_missing`.

This was a monitor parser failure, not a storage or provider-separation failure. At the failure checkpoint:

- Twitch D1 was `320.45 MB`;
- projected 90-day Twitch size was `368.77 MB`;
- provider headroom was `81.23 MB`;
- account-wide headroom was `882.78 MB`;
- the attempt-2 bindings matched before inspection;
- the normal Twitch configuration rollback exited `0`;
- all canary bindings were absent after rollback;
- the permanent direct category flag remained absent;
- Kick remained unchanged.

Artifact `8424948287` with digest `sha256:cf2ff1038ea4f51ec7d378fcba9e0503090afefa2ac0f831931dfeee43d06ed8` records the failure and successful rollback. Runtime category capture is no longer active.

The focused fix separates Wrangler stdout from stderr and replaces the suffix parser with ANSI-tolerant balanced JSON extraction. Fixtures cover prefixes, ANSI sequences, trailing warnings, and missing JSON. A future attempt still requires a separate exact trigger and a fresh start-job read-only preflight.
'''
if '## Attempt 2 monitor failure and rollback' not in wip:
    wip_path.write_text(wip.rstrip() + section + '\n')

for temporary in [
    Path('.github/workflows/temp-fix-twitch-monitor-json-parser.yml'),
    Path('.github/workflows/temp-run-twitch-monitor-json-parser-fix.yml'),
    Path('scripts/temp-fix-twitch-monitor-json-parser.py'),
]:
    temporary.unlink(missing_ok=True)
