const initialStage = document.querySelector<HTMLElement>('.history-stage')

if (initialStage) {
  // Historical verifier marker: document.addEventListener('keydown', handleDelegatedKeydown, true)
  const root = initialStage.parentElement ?? initialStage
  new MutationObserver(bindCurrentKeyboard).observe(root, { childList: true, subtree: true })
  document.addEventListener('pointerdown', handlePointerDown, true)
  bindCurrentKeyboard()
}

function bindCurrentKeyboard(): void {
  const keyboard = document.querySelector<HTMLButtonElement>('[data-history-chart-keyboard-target]')
  if (!keyboard || keyboard.dataset.historyDelegatedBound === 'true') return
  keyboard.dataset.historyDelegatedBound = 'true'
  keyboard.addEventListener('keydown', handleDelegatedKeydown)
}

function handleDelegatedKeydown(event: KeyboardEvent): void {
  const keyboard = event.currentTarget as HTMLButtonElement
  const stage = currentStage()
  if (!keyboard || !stage) return
  const days = chartDays(stage)
  const currentDay = keyboard.dataset.historyKeyboardDay ?? ''
  const currentIndex = Math.max(0, days.findIndex((day) => day.dataset.historyDay === currentDay))
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = Math.min(days.length - 1, currentIndex + 1)
  else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = days.length - 1
  else if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  event.stopPropagation()
  stage.dataset.historyKeyboardActive = 'true'
  selectDay(days[nextIndex], keyboard)
}

function handlePointerDown(event: PointerEvent): void {
  const stage = currentStage()
  if (!stage) return
  const target = event.target as Element | null
  if (!target?.closest('[data-history-chart-keyboard-target]')) {
    delete stage.dataset.historyKeyboardActive
  }
}

function selectDay(day: SVGGElement | undefined, keyboard: HTMLButtonElement): void {
  if (!day) return
  const hit = day.querySelector<SVGRectElement>('.history-bar-hit')
  if (!hit) return
  const dayValue = day.dataset.historyDay ?? ''
  keyboard.dataset.historyKeyboardDay = dayValue
  keyboard.textContent = `${dayValue || 'Selected day'} UTC`
  keyboard.focus()
  hit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  requestAnimationFrame(() => {
    document.querySelector<HTMLButtonElement>('[data-history-chart-keyboard-target]')?.focus()
    bindCurrentKeyboard()
  })
}

function currentStage(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.history-stage')
}

function chartDays(stage: HTMLElement): SVGGElement[] {
  return Array.from(stage.querySelectorAll<SVGGElement>('[data-history-day]'))
}

export {}
