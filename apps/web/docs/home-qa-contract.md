# Portal and Provider Home QA Contract

This page records the current production contract for the portal and provider home pages.

- The portal page must keep the current dark shell, `data-provider="portal"`, `.portal-grid`, Twitch/Kick panels, and `.signal-list`.
- Twitch and Kick home pages must keep `data-provider="twitch"` / `data-provider="kick"` respectively.
- Provider home pages must keep `.data-strip`, `.provider-overview`, `.surface.surface--dark`, and `.signal-list`.
- Provider home pages must link to Heatmap, Day Flow, Battle Lines, History, and Status through the global navigation or feature surfaces.
- The portal must not show combined Twitch/Kick totals as if they are one provider.
- A future change that restores old overview cards, fake live counts, or mock portal labels is a regression.
