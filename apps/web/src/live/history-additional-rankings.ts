import '../channel-profile-link.css'
import { activeRankingLimit, installRankingControls, syncRankingButtons } from './history-additional-rankings-controls'
import { renderAdditionalRanking } from './history-additional-rankings-render'
import { installRankingPayloadCapture, rankingPayload, rankingRows, rankingSort } from './history-additional-rankings-state'

let scheduled = false

function render(): void {
  const payload = rankingPayload()
  if (!payload) return
  renderAdditionalRanking(rankingRows(payload, rankingSort()), rankingSort(), activeRankingLimit())
  syncRankingButtons()
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

function installRankingOverwriteRecovery(): void {
  const tableBody = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  const cards = document.querySelector<HTMLElement>('[data-history-streamer-cards]')
  if (!tableBody || !cards) return

  const observer = new MutationObserver(() => {
    if (!rankingPayload()) return
    const tableHasProfileLink = Boolean(tableBody.querySelector('.history-streamer-profile-link'))
    const cardsHaveProfileLink = Boolean(cards.querySelector('.history-streamer-profile-link'))
    if (!tableHasProfileLink || !cardsHaveProfileLink) schedule()
  })
  observer.observe(tableBody, { childList: true, subtree: true })
  observer.observe(cards, { childList: true, subtree: true })
}

installRankingControls(schedule)
installRankingPayloadCapture(schedule)
installRankingOverwriteRecovery()
