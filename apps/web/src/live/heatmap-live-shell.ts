import type { FeatureMeta } from '../types/page-models'

export function renderHeatmapLiveSummaryGrid(): string {
  return `
    <article id="heatmap-summary-streams" class="summary-card">
      <div class="summary-card__label">Active streams</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-viewers" class="summary-card">
      <div class="summary-card__label">Total viewers observed</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-momentum" class="summary-card">
      <div class="summary-card__label">Strongest momentum stream</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-activity" class="summary-card">
      <div class="summary-card__label">Highest activity stream</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
  `
}

export function renderHeatmapLiveFeatureLayout(feature: FeatureMeta): string {
  return `
    <section class="feature-layout feature-layout--heatmap">
      <article class="chart-stage chart-stage--feature">
        <div class="chart-stage__label">${feature.label}</div>
        <h2>${feature.chartTitle}</h2>
        <p>${feature.chartBody}</p>
        <div class="chart-placeholder chart-placeholder--${feature.key}">
          <div class="chart-placeholder__grid"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--1"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--2"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--3"></div>
        </div>
      </article>

      <aside class="rail-stack">
        <section class="rail-card rail-card--detail">
          <div class="rail-card__label">Selected stream</div>
          <h2 id="heatmap-detail-title">No stream selected</h2>
          <p id="heatmap-detail-body">Select a tile to inspect its current viewers, momentum, activity, and stream link.</p>
          <div class="heatmap-live-detail-grid">
            <div class="heatmap-live-detail-stat">
              <span class="heatmap-live-detail-stat__label">Viewers</span>
              <span id="heatmap-detail-viewers" class="heatmap-live-detail-stat__value">—</span>
            </div>
            <div class="heatmap-live-detail-stat">
              <span class="heatmap-live-detail-stat__label">Share</span>
              <span id="heatmap-detail-share" class="heatmap-live-detail-stat__value">—</span>
            </div>
            <div class="heatmap-live-detail-stat">
              <span class="heatmap-live-detail-stat__label">Momentum</span>
              <span id="heatmap-detail-momentum" class="heatmap-live-detail-stat__value">—</span>
            </div>
            <div class="heatmap-live-detail-stat">
              <span class="heatmap-live-detail-stat__label">Activity</span>
              <span id="heatmap-detail-activity" class="heatmap-live-detail-stat__value">—</span>
            </div>
          </div>
          <a id="heatmap-detail-link" class="heatmap-live-link" target="_blank" rel="noreferrer">Open stream</a>
        </section>

        <section class="rail-card rail-card--detail">
          <div class="rail-card__label">Live status</div>
          <h2 id="heatmap-status-title">Waiting for heatmap API</h2>
          <p id="heatmap-status-body">The rail will switch to live Twitch status once the latest snapshot loads.</p>
        </section>

        <section class="rail-card rail-card--detail">
          <div class="rail-card__label">Legend</div>
          <h2>How to read this field</h2>
          <p id="heatmap-legend-body">Area tracks viewers. Tile color tracks momentum. Glow strength reflects activity signal when available.</p>
        </section>
      </aside>
    </section>
  `
}

export function renderHeatmapLiveSupportGrid(): string {
  return `
    <section class="support-grid support-grid--feature">
      <article class="support-card support-card--live">
        <div class="support-card__label">Momentum ranking</div>
        <h2>Top movers right now</h2>
        <div id="heatmap-support-movers"><p>Waiting for momentum ranking.</p></div>
      </article>
      <article class="support-card support-card--live">
        <div class="support-card__label">Activity ranking</div>
        <h2>Strongest chat signal</h2>
        <div id="heatmap-support-activity"><p>Waiting for activity ranking.</p></div>
      </article>
      <article class="support-card support-card--live">
        <div class="support-card__label">Coverage note</div>
        <h2>Current snapshot scope</h2>
        <div id="heatmap-support-coverage"><p>Waiting for coverage note.</p></div>
      </article>
    </section>
  `
}
