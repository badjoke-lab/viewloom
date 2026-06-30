from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'scripts/verify-quality-u10d-analysis-coherence.mjs'
source = path.read_text(encoding='utf-8')

note_old = "for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'API change authorized: no', 'Provider combination authorized: no']) assert.ok(note.includes(fragment))"
note_new = "for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'APIs, persistence, collection, retention, output contracts, and provider separation remain unchanged.']) assert.ok(note.includes(fragment))"
if source.count(note_old) != 1:
    raise RuntimeError('U10D note verifier target changed')
source = source.replace(note_old, note_new, 1)

syntax_old = '''assert.ok(dayFlow.includes("return 'wide'
}

function applyLayout"))'''
syntax_new = r'''assert.ok(dayFlow.includes("return 'wide'\n}\n\nfunction applyLayout"))'''
if source.count(syntax_old) != 1:
    raise RuntimeError('U10D Day Flow verifier escape target changed')
source = source.replace(syntax_old, syntax_new, 1)

path.write_text(source, encoding='utf-8')
print('U10D verifier finalization applied.')
