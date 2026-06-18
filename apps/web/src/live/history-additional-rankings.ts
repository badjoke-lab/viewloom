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

installRankingControls(schedule)
installRankingPayloadCapture(schedule)
