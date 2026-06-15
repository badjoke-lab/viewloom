type DatePrecision = 'month' | 'day'

type ChangelogEntry = {
  id: string
  date: string
  datePrecision: DatePrecision
  title: string
}

type ChangelogPayload = {
  version: 'viewloom-changelog-v1'
  entries: ChangelogEntry[]
}

const timeline = document.getElementById('changelog-timeline')

if (timeline) void loadChangelog()

async function loadChangelog(): Promise<void> {
  setState('loading')
  try {
    const response = await fetch('/data/changelog.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`Changelog request failed with ${response.status}.`)

    const payload = await response.json() as ChangelogPayload
    validatePayload(payload)
    renderEntries(payload.entries)
  } catch (error) {
    renderError(error instanceof Error ? error.message : 'The Changelog could not be loaded.')
  }
}

function validatePayload(payload: ChangelogPayload): void {
  if (payload?.version !== 'viewloom-changelog-v1') throw new Error('Unexpected Changelog data version.')
  if (!Array.isArray(payload.entries)) throw new Error('Changelog entries are unavailable.')
}

function renderEntries(entries: ChangelogEntry[]): void {
  if (!timeline) return
  timeline.replaceChildren()

  if (entries.length === 0) {
    setState('empty')
    const empty = document.createElement('p')
    empty.className = 'changelog-state'
    empty.textContent = 'No reviewed milestones have been published.'
    timeline.append(empty)
    timeline.setAttribute('aria-busy', 'false')
    return
  }

  for (const entry of entries) timeline.append(createEntry(entry))
  setState('ready')
  timeline.setAttribute('aria-busy', 'false')
}

function createEntry(entry: ChangelogEntry): HTMLElement {
  const article = document.createElement('article')
  article.className = 'changelog-entry'
  article.dataset.changelogId = entry.id

  const marker = document.createElement('span')
  marker.className = 'changelog-entry__marker'
  marker.setAttribute('aria-hidden', 'true')

  const time = document.createElement('time')
  time.className = 'changelog-entry__date'
  time.dateTime = entry.date
  time.textContent = formatDate(entry.date, entry.datePrecision)

  const title = document.createElement('h2')
  title.textContent = entry.title

  const copy = document.createElement('div')
  copy.className = 'changelog-entry__copy'
  copy.append(time, title)

  article.append(marker, copy)
  return article
}

function renderError(message: string): void {
  if (!timeline) return
  setState('error')
  timeline.replaceChildren()

  const state = document.createElement('div')
  state.className = 'changelog-state changelog-state--error'

  const title = document.createElement('strong')
  title.textContent = 'Changelog unavailable'

  const detail = document.createElement('span')
  detail.textContent = message

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'button button--small'
  retry.textContent = 'Retry'
  retry.addEventListener('click', () => void loadChangelog())

  state.append(title, detail, retry)
  timeline.append(state)
  timeline.setAttribute('aria-busy', 'false')
}

function setState(state: 'loading' | 'ready' | 'empty' | 'error'): void {
  document.body.dataset.changelogState = state
  timeline?.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false')
}

function formatDate(value: string, precision: DatePrecision): string {
  const date = new Date(precision === 'month' ? `${value}-01T00:00:00.000Z` : `${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return value

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }
  if (precision === 'day') options.day = 'numeric'
  return new Intl.DateTimeFormat('en-US', options).format(date)
}
