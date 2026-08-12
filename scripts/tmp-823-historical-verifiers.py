from pathlib import Path

HIDDEN_SHA = 'a802e7fe1e964180904c72744b7228c549a54660'

candidate_path = Path('scripts/verify-12a10-kick-battle-lines-category-candidate.mjs')
candidate = candidate_path.read_text()
if "import { execFileSync } from 'node:child_process'" not in candidate:
    candidate = candidate.replace("import assert from 'node:assert/strict'\n", "import assert from 'node:assert/strict'\nimport { execFileSync } from 'node:child_process'\n")
candidate = candidate.replace("const read = (path) => readFileSync(path, 'utf8')\n", f"const HIDDEN_SHA = '{HIDDEN_SHA}'\nconst read = (path) => readFileSync(path, 'utf8')\nconst readAt = (sha, path) => execFileSync('git', ['show', `${{sha}}:${{path}}`], {{ encoding: 'utf8' }})\n")
for var, path in [
    ('core', 'apps/web/functions/_lib/battle-lines-core.ts'),
    ('category', 'apps/web/functions/_lib/battle-lines-category.ts'),
    ('api', 'apps/web/functions/api/kick-battle-lines.ts'),
    ('controller', 'apps/web/src/live/battle-lines-current-shell-entry.ts'),
    ('kickHtml', 'apps/web/kick/battle-lines/index.html'),
    ('twitchApi', 'apps/web/functions/api/battle-lines.ts'),
]:
    old = f"const {var} = read('{path}')"
    new = f"const {var} = readAt(HIDDEN_SHA, '{path}')"
    if old not in candidate:
        raise SystemExit(f'candidate read missing: {old}')
    candidate = candidate.replace(old, new)
needle = "  nativeBrowserGlobalsPreserved: true,\n"
if "historicalVerifier: true" not in candidate:
    if needle not in candidate:
        raise SystemExit('candidate output anchor missing')
    candidate = candidate.replace(needle, needle + "  historicalVerifier: true,\n  hiddenAuthoritySha: HIDDEN_SHA,\n")
candidate_path.write_text(candidate)

evidence_path = Path('scripts/verify-12a10-kick-battle-lines-category-hidden-production-evidence.mjs')
evidence = evidence_path.read_text()
if "import { execFileSync } from 'node:child_process'" not in evidence:
    evidence = evidence.replace("import assert from 'node:assert/strict'\n", "import assert from 'node:assert/strict'\nimport { execFileSync } from 'node:child_process'\n")
evidence = evidence.replace("const read = (path) => readFileSync(path, 'utf8')\n", f"const HIDDEN_SHA = '{HIDDEN_SHA}'\nconst read = (path) => readFileSync(path, 'utf8')\nconst readAt = (sha, path) => execFileSync('git', ['show', `${{sha}}:${{path}}`], {{ encoding: 'utf8' }})\n")
for var, path in [
    ('api', 'apps/web/functions/api/kick-battle-lines.ts'),
    ('controller', 'apps/web/src/live/battle-lines-current-shell-entry.ts'),
]:
    old = f'const {var} = read({var}Path)'
    new = f'const {var} = readAt(HIDDEN_SHA, {var}Path)'
    if old not in evidence:
        raise SystemExit(f'evidence read missing: {old}')
    evidence = evidence.replace(old, new)
needle = "  oneShotProductionWorkflowRetired: true,\n"
if "historicalRuntimeVerifier: true" not in evidence:
    if needle not in evidence:
        raise SystemExit('evidence output anchor missing')
    evidence = evidence.replace(needle, needle + "  historicalRuntimeVerifier: true,\n  hiddenAuthoritySha: HIDDEN_SHA,\n")
evidence_path.write_text(evidence)
