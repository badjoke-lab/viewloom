let scheduled = false
const observer = new MutationObserver(schedule)
observer.observe(document.documentElement, { childList: true, subtree: true })
schedule()

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    applyFiveColumnLayout()
  })
}

function applyFiveColumnLayout(): void {
  const table = document.querySelector<HTMLTableElement>('.history-peak-archive')
  if (!table) return
  table.classList.add('history-peak-archive--five-columns')
  table.querySelectorAll<HTMLTableRowElement>('tr').forEach((row) => {
    const cells = Array.from(row.children) as HTMLTableCellElement[]
    if (cells.length >= 7) {
      cells[5]?.remove()
      cells[4]?.remove()
    }
    const visible = Array.from(row.children) as HTMLTableCellElement[]
    if (visible.length !== 5) return
    visible[0].classList.add('history-column-rank')
    visible[1].classList.add('history-column-streamer')
    visible[2].classList.add('history-column-number')
    visible[3].classList.add('history-column-number')
    visible[4].classList.add('history-column-change')
    if (row.parentElement?.tagName === 'THEAD') {
      visible[4].textContent = 'Vs previous'
      visible[4].title = 'Change versus the immediately preceding equal-length period'
    }
  })
}

export {}
