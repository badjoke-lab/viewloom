const stage = document.querySelector<HTMLElement>('.history-stage')

if (stage) {
  document.addEventListener('keydown', handleDelegatedKeydown, true)
  document.addEventListener('click', handleDelegatedClick, true)
}

function handleDelegatedKeydown(event: KeyboardEvent): void {
  const keyboard = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-history-chart-keyboard-target]')
  if (!keyboard) return
  const days = chartDays()
  const currentDay = keyboard.dataset.historyKeyboardDay ?? ''
  const currentIndex = Math.max(0, days.findIndex((day) => day.dataset.historyDay === currentDay))
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = Math.min(days.length - 1, currentIndex + 1)
  else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = days.length - 1
  else return
  event.preventDefault()
  event.stopImmediatePropagation()
  selectDay(days[nextIndex], keyboard)
}

function handleDelegatedClick(event: MouseEvent): void {
  const keyboard = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-history-chart-keyboard-target]')
  if (!keyboard) return
  event.stopImmediatePropagation()
  const day = chartDays().find((item) => item.dataset.historyDay === keyboard.dataset.historyKeyboardDay)
  selectDay(day, keyboard)
}

function selectDay(day: SVGGElement | undefined, keyboard: HTMLButtonElement): void {
  if (!day) return
  const hit = day.querySelector<SVGRectElement>('.history-bar-hit')
  if (!hit) return
  const dayValue = day.dataset.historyDay ?? ''
  keyboard.dataset.historyKeyboardDay = dayValue
  keyboard.textContent = `${dayValue || 'Selected day'} UTC`
  hit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  keyboard.focus()
}

function chartDays(): SVGGElement[] {
  return stage ? Array.from(stage.querySelectorAll<SVGGElement>('[data-history-day]')) : []
}

export {}
