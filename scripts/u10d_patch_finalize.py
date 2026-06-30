from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'scripts/verify-quality-u10d-analysis-coherence.mjs'
source = path.read_text(encoding='utf-8')
old = "for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'API change authorized: no', 'Provider combination authorized: no']) assert.ok(note.includes(fragment))"
new = "for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'APIs, persistence, collection, retention, output contracts, and provider separation remain unchanged.']) assert.ok(note.includes(fragment))"
if source.count(old) != 1:
    raise RuntimeError('U10D note verifier target changed')
path.write_text(source.replace(old, new, 1), encoding='utf-8')
print('U10D verifier finalization applied.')
