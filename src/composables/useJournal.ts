import { ref } from 'vue'
import { content, type JournalBlock } from '@/data/site'
import { photos } from '@/data/photos'
import { loadStories, loadStory, recordStoryView } from '@/kit/collections'

/**
 * The journal, from two places at once.
 *
 * Entries Ashley publishes in her Apotome portal come first: they are fetched
 * through the collections add-on, because the content overlay cannot grow an
 * array and a post published through it would never render. The three posts
 * compiled into `data/site.ts` stay as a fallback for the same slugs until
 * the portal carries them, and for any visit the studio API cannot answer.
 *
 * Portal entries win on a slug collision, so importing a bundled post into
 * the portal replaces it on the site with nothing else to change.
 */
export interface JournalEntry {
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  deck: string
  cover: { src: string; alt: string } | null
  /** html from the portal editor; absent on a bundled entry */
  body?: string
  /** the compiled-in blocks; absent on a portal entry */
  blocks?: JournalBlock[]
  source: 'portal' | 'bundled'
}

const entries = ref<JournalEntry[]>(bundled())
const loaded = ref(false)
let inflight: Promise<void> | null = null

function bundled(): JournalEntry[] {
  return content.journal.map((p) => {
    const photo = photos.find((x) => x.id === p.coverId)
    return {
      slug: p.slug,
      title: p.title,
      date: p.date,
      deck: p.deck,
      cover: photo ? { src: photo.src, alt: photo.alt } : null,
      blocks: p.blocks,
      source: 'bundled' as const,
    }
  })
}

function fromPortal(s: {
  slug: string
  title: string
  date: string
  excerpt: string
  heroImageUrl: string | null
  body?: string
}): JournalEntry {
  return {
    slug: s.slug,
    title: s.title,
    date: s.date,
    deck: s.excerpt,
    cover: s.heroImageUrl ? { src: s.heroImageUrl, alt: s.title } : null,
    body: s.body,
    source: 'portal',
  }
}

/** Portal first, then the bundled posts the portal does not carry; newest first. */
async function refresh(): Promise<void> {
  const result = await loadStories({ kind: 'article', limit: 50 })
  if (result.ok) {
    const portal = result.data.items.map(fromPortal)
    const seen = new Set(portal.map((e) => e.slug))
    entries.value = [...portal, ...bundled().filter((e) => !seen.has(e.slug))].sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  }
  loaded.value = true
}

export function useJournal() {
  if (!inflight) inflight = refresh()

  /** One entry with its body. A portal entry is fetched in full on first open. */
  async function open(slug: string): Promise<JournalEntry | null> {
    await inflight
    const known = entries.value.find((e) => e.slug === slug)
    if (known?.source === 'bundled') return known
    const full = await loadStory(slug)
    if (full.ok) {
      recordStoryView(slug)
      const entry = fromPortal(full.data)
      const i = entries.value.findIndex((e) => e.slug === slug)
      if (i >= 0) entries.value[i] = entry
      return entry
    }
    return known ?? null
  }

  return { entries, loaded, ready: () => inflight!, open }
}
