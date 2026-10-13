import { kitEnvWith } from './env'
import { kitBeacon, kitFetch, type KitResult } from './client'

/**
 * Blog posts, video entries and podcast episodes.
 *
 * This module exists because the content overlay cannot do it. `applyArray` in
 * `editor/index.ts` iterates `target.length` and patches leaves in place; it
 * can never append. A story published through the overlay saves correctly,
 * comes back from the endpoint correctly, and renders nowhere, with no error
 * in the chain to tell you why. Collections grow, so collections are fetched.
 *
 * Promise-based with no Vue import, so the same file works in any site. A
 * `shallowRef` composable was considered and rejected: it drags `vue` into a
 * file that otherwise runs anywhere, and hides the loading state each site's
 * own design needs to express.
 */

export type CollectionKind = 'article' | 'video' | 'podcast'

export interface ApotomeStory {
  slug: string
  kind: CollectionKind
  title: string
  excerpt: string
  author: string
  /** YYYY-MM-DD */
  date: string
  readingTime: string | null
  topics: string[]
  heroImageUrl: string | null
  /** audio for a podcast, video for a vlog entry */
  mediaUrl: string | null
  mediaDurationSec: number | null
  /** list responses omit these; only the detail route carries them */
  body?: string
  transcript?: string | null
  views?: number
}

export interface StoryPage {
  items: ApotomeStory[]
  total: number
  page: number
  pageSize: number
}

interface Opts {
  siteKey?: string
  apiUrl?: string
}

const NOT_WIRED = 'Publishing is not connected yet.'

export function loadStories(
  opts: Opts & { kind?: CollectionKind; topic?: string; page?: number; limit?: number } = {},
): Promise<KitResult<StoryPage>> {
  const env = kitEnvWith(opts)
  if (!env) return Promise.resolve({ ok: false, error: NOT_WIRED })

  const params = new URLSearchParams()
  if (opts.kind) params.set('kind', opts.kind)
  if (opts.topic) params.set('topic', opts.topic)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  const qs = params.toString()

  return kitFetch<StoryPage>(
    env,
    `/stories/${encodeURIComponent(env.siteKey)}${qs ? `?${qs}` : ''}`,
  )
}

export function loadStory(slug: string, opts: Opts = {}): Promise<KitResult<ApotomeStory>> {
  const env = kitEnvWith(opts)
  if (!env) return Promise.resolve({ ok: false, error: NOT_WIRED })
  return kitFetch<ApotomeStory>(
    env,
    `/stories/${encodeURIComponent(env.siteKey)}/${encodeURIComponent(slug)}`,
  )
}

/**
 * Count one read. Fire and forget.
 *
 * sendBeacon first, exactly like `analytics.ts`, so it survives the reader
 * navigating away mid-request. Never awaited, never throws, and the server
 * de-duplicates per visitor per day, so calling it on every mount is fine.
 */
export function recordStoryView(slug: string, opts: Opts = {}): void {
  const env = kitEnvWith(opts)
  if (!env || typeof window === 'undefined') return
  kitBeacon(
    `${env.apiUrl}/api/stories/${encodeURIComponent(env.siteKey)}/${encodeURIComponent(slug)}/view`,
    {},
  )
}
