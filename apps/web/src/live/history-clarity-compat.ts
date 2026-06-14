const observer = new MutationObserver(sync)
observer.observe(document.documentElement, { childList: true, subtree: true })
sync()

function sync(): void {
  const toggle = document.querySelector<HTMLElement>('[data-history-clarity-toggle]')
  if (toggle && !toggle.hasAttribute('data-history-archive-toggle')) {
    toggle.setAttribute('data-history-archive-toggle', '')
  }
}

export {}
