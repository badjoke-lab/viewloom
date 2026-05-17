# ViewLoom IA / Route Plan

Status: fixed IA plan before common outer-page implementation and global UI alignment.  
Scope: global routes, provider routes, navigation rules, status-page split, and UI-unification timing.  
Created: 2026-05-17

## 1. Core decision

ViewLoom should not create duplicated outer pages under each provider.

Do not create these routes:

- `/twitch/about/`
- `/kick/about/`
- `/twitch/support/`
- `/kick/support/`
- `/twitch/contact/`
- `/kick/contact/`

Use common global pages for shared information:

- `/about/`
- `/support/`
- `/contact/`

Keep Status provider-specific because provider status is genuinely different:

- `/twitch/status/`
- `/kick/status/`

## 2. Final route map

Initial public route map:

```text
/
/about/
/support/
/contact/

/twitch/
/twitch/heatmap/
/twitch/day-flow/
/twitch/battle-lines/
/twitch/history/
/twitch/status/

/kick/
/kick/heatmap/
/kick/day-flow/
/kick/battle-lines/
/kick/history/
/kick/status/
```

### Route roles

| Route | Role |
| --- | --- |
| `/` | ViewLoom overall portal |
| `/about/` | What ViewLoom is, across all providers |
| `/support/` | Support, donation, GitHub/support links |
| `/contact/` | Contact path, currently Google Form link only |
| `/twitch/` | Twitch provider home |
| `/twitch/status/` | Twitch data collection and limitation status |
| `/kick/` | Kick provider home |
| `/kick/status/` | Kick data collection and limitation status |

Provider feature pages:

| Role | Twitch | Kick |
| --- | --- | --- |
| Now | `/twitch/heatmap/` | `/kick/heatmap/` |
| Today | `/twitch/day-flow/` | `/kick/day-flow/` |
| Rivalry | `/twitch/battle-lines/` | `/kick/battle-lines/` |
| Trends | `/twitch/history/` | `/kick/history/` |

## 3. Why Status remains provider-specific

Status is the only outer/support-like page whose content should differ materially by provider.

Twitch status needs to cover:

- Twitch collector state
- Twitch coverage
- Twitch data delay
- Twitch-specific limitations
- Twitch API / collector reliability

Kick status needs to cover:

- Kick collector state
- Kick coverage
- Kick data delay
- Kick-specific limitations
- Kick API / collector reliability

About, Support, and Contact do not need provider-specific pages because they would duplicate the same information.

## 4. Display naming

The route remains short:

```text
/twitch/status/
/kick/status/
```

The visible label should prefer:

```text
Data Status
```

Use `Status` only where space is extremely constrained.

## 5. Provider-home explanatory copy

Provider-specific explanation belongs on the provider home, not on duplicated `/provider/about/` pages.

### Twitch home copy

Use a short explanation on `/twitch/`:

```text
Twitch ViewLoom is an unofficial observation view for Twitch live activity. Data may be delayed, partial, or unavailable depending on collection status.
```

Detailed limitations should link to:

```text
/twitch/status/
```

### Kick home copy

Use a short explanation on `/kick/`:

```text
Kick ViewLoom is an unofficial observation view for Kick live activity. Coverage and available signals may differ from Twitch.
```

Detailed limitations should link to:

```text
/kick/status/
```

## 6. Header and footer rules

### Global portal header

The global header should expose the site-level routes:

```text
ViewLoom | Twitch | Kick | About | Support | Contact
```

### Provider-page primary nav

Provider pages should prioritize analysis functions:

```text
ViewLoom | Heatmap | Day Flow | Battle Lines | History | Data Status
```

Provider pages should not put About, Support, and Contact into the main provider-function nav.

### Provider footer / secondary links

Provider pages may expose shared outer links in a lower-priority footer or right-side utility area:

```text
About | Support | Contact
```

This keeps the provider UI focused on live-analysis functions.

## 7. Current implementation note

As of this plan, Kick History exists and is provider-row backed. Some provider-shell pages still use helper scripts to insert History links because the older shared shell model started with three features.

Do not treat the helper approach as the final architecture.

Future cleanup should make History first-class in the shared provider feature model.

## 8. Recommended implementation order

### Step 1: IA route plan documentation

Current PR.

Purpose:

- Freeze the route map.
- Prevent duplicate provider-level About / Support / Contact pages.
- Confirm Status as provider-specific.
- Set the timing for UI alignment.

### Step 2: Add common outer pages

Candidate PR:

```text
Add common About, Support, and Contact pages
```

Add:

- `/about/`
- `/support/`
- `/contact/`

Rules:

- Keep them provider-neutral.
- Keep Contact as a Google Form handoff only.
- Add simple global navigation.
- Register pages in Vite build input.

### Step 3: Add provider-home explanatory sections

Candidate PR:

```text
Add provider home explanation sections
```

Update:

- `/twitch/`
- `/kick/`

Add the short provider copy from section 5.

Link detailed limitations to the provider-specific status page.

### Step 4: Align provider navigation and Data Status labels

Candidate PR:

```text
Align provider navigation and Data Status labels
```

Update provider pages to prefer:

```text
Heatmap | Day Flow | Battle Lines | History | Data Status
```

Use `/twitch/status/` and `/kick/status/` as the URLs.

### Step 5: Make History first-class in shared shell

Candidate PR:

```text
Make History first-class in shared provider shell
```

Purpose:

- Remove long-term reliance on helper scripts for History links.
- Add History to shared feature definitions.
- Keep Twitch and Kick four-feature parity.

This should happen after route and common pages are fixed because it touches shared rendering.

### Step 6: Global UI alignment pass

Candidate PR:

```text
Unify ViewLoom page UI system
```

Timing:

- After route map is fixed.
- After common outer pages exist.
- Before browser QA.

Scope:

- Hero shape
- Provider nav
- Status strips
- Summary cards
- Footer
- Twitch/Kick color differences
- History alignment with other feature pages
- Mobile behavior at 360px, 390px, and 430px

### Step 7: Static checks

Candidate PR or local gate:

```text
Run build and typecheck cleanup
```

Check:

- Multipage Vite build inputs
- TypeScript errors
- Functions typecheck
- Missing imports
- Route registration

### Step 8: Browser QA

Browser QA can remain deferred until the user is available.

When ready, use:

- `docs/kick-parity-qa.md`
- `docs/history-v1-qa.md`

Check:

- Desktop
- Mobile 360px / 390px / 430px
- Provider pages
- Outer pages
- API state strips
- Data Status pages

### Step 9: Public finishing pass

After UI and browser QA:

- sitemap
- robots
- canonical URLs
- Open Graph / Twitter metadata
- shared footer
- support link verification
- contact Google Form link verification
- disclaimer wording

## 9. Work that should not be inserted prematurely

Do not jump directly to full UI polish before the route map and shared outer pages are implemented.

Do not create provider-specific About / Support / Contact pages.

Do not refactor the full shared shell and route model in the same PR as adding outer pages.

Do not start browser QA as a blocker while the user cannot verify pages.

## 10. Current project position

Current completed work:

- Twitch core pages exist.
- Twitch History exists.
- Kick Heatmap provider-row API exists.
- Kick Day Flow provider-row API exists.
- Kick Battle Lines provider-row API exists.
- Kick History provider-row API and page exist.
- Kick navigation and status now include History.
- Kick parity QA checklist exists.

Current next work after this document:

1. Add common `/about/`, `/support/`, and `/contact/` pages.
2. Add provider-home explanatory copy.
3. Align provider nav labels around `Data Status`.
4. Make History first-class in the shared shell.
5. Run global UI alignment.
