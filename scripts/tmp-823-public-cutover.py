from pathlib import Path

api_path = Path('apps/web/functions/api/kick-battle-lines.ts')
controller_path = Path('apps/web/src/live/battle-lines-current-shell-entry.ts')

api = api_path.read_text()
replacements = [
    ("implementationState: 'hidden_candidate'", "implementationState: 'public'", 2),
    ("publicExposureAuthorized: false", "publicExposureAuthorized: true", 2),
    ("'category_implementation_state=hidden_candidate'", "'category_implementation_state=public'", 1),
    ("'category_public_exposure=false'", "'category_public_exposure=true'", 1),
]
for old, new, expected in replacements:
    actual = api.count(old)
    if actual != expected:
        raise SystemExit(f'API replacement count {old!r}: expected {expected}, got {actual}')
    api = api.replace(old, new)
api_path.write_text(api)

controller = controller_path.read_text()
old_decl = "const categoryPreviewEnabled = provider === 'kick' && params.get('categoryPreview') === '1'"
new_decl = "const legacyCategoryPreviewRequested = provider === 'kick' && params.get('categoryPreview') === '1'\nconst categoryControlsEnabled = provider === 'kick'\nlet retainLegacyCategoryPreview = legacyCategoryPreviewRequested"
if controller.count(old_decl) != 1:
    raise SystemExit('category preview declaration mismatch')
controller = controller.replace(old_decl, new_decl)
controller = controller.replace('categoryPreviewEnabled', 'categoryControlsEnabled')

old_url = """  if (categoryControlsEnabled) {\n    next.set('categoryPreview', '1')\n    next.set('category', state.category)\n  }"""
new_url = """  if (categoryControlsEnabled) {\n    if (retainLegacyCategoryPreview) next.set('categoryPreview', '1')\n    next.set('category', state.category)\n  }"""
if controller.count(old_url) != 1:
    raise SystemExit('syncUrl category block mismatch')
controller = controller.replace(old_url, new_url)

old_change = """    const select = event.currentTarget as HTMLSelectElement\n    state.category = normalizeCategory(select.value)"""
new_change = """    const select = event.currentTarget as HTMLSelectElement\n    retainLegacyCategoryPreview = false\n    state.category = normalizeCategory(select.value)"""
if controller.count(old_change) != 1:
    raise SystemExit('category change handler mismatch')
controller = controller.replace(old_change, new_change)

checks = [
    ("root.dataset.battleCategoryPreview = 'hidden'", "root.dataset.battleCategoryPreview = 'public'"),
    ("filter.implementationState !== 'hidden_candidate' || filter.publicExposureAuthorized !== false", "filter.implementationState !== 'public' || filter.publicExposureAuthorized !== true"),
]
for old, new in checks:
    if controller.count(old) != 1:
        raise SystemExit(f'controller replacement mismatch: {old}')
    controller = controller.replace(old, new)

controller_path.write_text(controller)
