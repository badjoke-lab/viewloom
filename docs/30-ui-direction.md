# ViewLoom UI Direction v0.1

## 0. Purpose

This document defines the visual and structural direction for ViewLoom.
The goal is not to preserve the old Livefield look. The goal is to preserve the product roles while rebuilding the presentation into the ViewLoom direction.

## 1. Source material policy

Two existing design materials are used differently.

### 1.1 ZIP mock
The ZIP mock is the structural base.
It is used for:
- portal split
- Twitch top / Kick top separation
- page inventory
- shell and navigation ideas
- future slot placement

It is not the final visual target.

### 1.2 Image mocks
The image mocks are the visual target.
They are used for:
- color depth
- glow balance
- chart prominence
- content density
- right-rail composition
- overall product feel

## 2. Core visual principles

1. Dark cinematic surface, not admin dashboard flatness.
2. Twitch uses purple-led accents.
3. Kick uses green-led accents.
4. Shared app structure, provider-specific color identity.
5. Strong main chart area.
6. Useful right rail, not decorative filler.
7. Product-feel first, wireframe-feel second.

## 3. Page family direction

### 3.1 Portal
The portal should follow the first mock direction.
It should:
- split Twitch and Kick clearly
- show the three roles quickly
- feel like the entrance to two parallel observatories
- remain simpler than provider-specific tops

### 3.2 Provider top pages
The Twitch top and Kick top should combine:
- first mock for structure
- second mock for density and chart-led layout

Expected layout:
- strong hero / top metrics
- primary chart block
- right rail with leaderboard / recent activity / status
- lower table block for movers / comparisons / live lists

### 3.3 Feature pages
Feature pages must inherit the provider shell and keep a chart-first hierarchy.

- Heatmap pages: now-first, spatial or ranking-oriented, active-now emphasis
- Day Flow pages: timeline-first, ownership-through-the-day emphasis
- Battle Lines pages: comparison-first, overlap / reversal / pressure emphasis

## 4. Battle Lines chart direction

The second image mock's large-chart skeleton can be reused for Battle Lines.
But the chart content must change.

Battle Lines should not look like a single generic growth line.
It should emphasize:
- pair rivalry
- crossing points
- reversals
- spread widening / narrowing
- heated windows
- strongest battle focus

So the reused pattern is:
- large central comparison chart
- right rail detail and ranking
- lower supporting table

The reused pattern is not:
- generic portfolio line chart behavior

## 5. Shared system rules

- Same shell logic across Twitch and Kick
- Same card family across providers
- Same spacing system across providers
- Same typography scale across providers
- Different provider accent/glow palettes

## 6. What to avoid

- old Livefield plain utility look as the final target
- admin-console stiffness
- oversized empty areas without information value
- weak main chart presence
- using the ZIP mock visual style as the final finish

## 7. First implementation translation

### first implementation target
- portal shell
- Twitch shell
- Kick shell
- reusable chart panel component
- reusable right rail component
- reusable status block component

### later polish target
- ambient backgrounds
- layered glow tuning
- richer chart styling
- provider-specific surface details

## 8. Definition of done for UI direction

UI direction should be considered established when all of the following are true:
- portal clearly reads as the entry point to Twitch and Kick
- Twitch and Kick tops feel like siblings, not clones
- the main chart dominates the page hierarchy
- the right rail is functional and dense
- Battle Lines has a rivalry-specific visual language
- the overall feel is closer to the image mocks than to the old Livefield pages
