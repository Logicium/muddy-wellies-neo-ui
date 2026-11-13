/**
 * The public route table, with each page's SEO record.
 *
 * This is the only list of public routes. The router spreads it; the
 * prerender (scripts/prerender.ts) walks it to write one HTML file per page,
 * the sitemap, robots.txt and llms.txt; the runtime applies the same records on
 * navigation. The account portal lives in the router and is never indexed.
 * No browser dependency here: the prerender imports this under Node.
 */
import type { RouteRecordRaw } from 'vue-router'
import { articleNode, creativeWorkNode, esc, itemListNode, serviceNode, truncate, type RouteSeo } from '@/seo'
import { content, nav, type JournalBlock } from '@/data/site'
import { categoryLabels, photos, type Photo, type PhotoCategory } from '@/data/photos'

/* ------------------------------ journal ------------------------------ */

/** One entry as the page sees it: the portal's shape and the bundled shape, unified. */
export interface JournalSeoEntry {
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  deck: string
  cover: { src: string; alt: string; w?: number; h?: number } | null
  /** html from the portal editor */
  body?: string
  /** the compiled-in blocks */
  blocks?: JournalBlock[]
  source: 'portal' | 'bundled'
}

const photoById = (id: string | undefined): Photo | undefined => (id ? photos.find((p) => p.id === id) : undefined)

function bundledEntries(): JournalSeoEntry[] {
  return content.journal.map((p) => {
    const photo = photoById(p.coverId)
    return {
      slug: p.slug,
      title: p.title,
      date: p.date,
      deck: p.deck,
      cover: photo ? { src: photo.src, alt: photo.alt, w: photo.w, h: photo.h } : null,
      blocks: p.blocks,
      source: 'bundled' as const,
    }
  })
}

/** What the build read, for the journal index: set once loadEntries settles. */
let journalEntries: JournalSeoEntry[] = bundledEntries()
let entriesCache: Promise<JournalSeoEntry[]> | null = null

/** The build runs under Node; the site key is only read there. */
const buildEnv = (key: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key]

interface PortalStory {
  slug: string
  title: string
  date: string
  excerpt: string
  heroImageUrl: string | null
  body?: string
}

/**
 * Entries at build: the portal's published stories first (the same endpoint
 * src/composables/useJournal.ts reads), then the bundled posts it does not
 * carry. Falls back to the bundled three when the API cannot answer.
 */
function loadEntries(apiUrl: string | undefined, fetchFn: typeof fetch): Promise<JournalSeoEntry[]> {
  if (!entriesCache) {
    entriesCache = (async () => {
      const siteKey = buildEnv('VITE_APOTOME_SITE_KEY')
      const bundled = bundledEntries()
      if (!apiUrl || !siteKey) return bundled
      try {
        const base = apiUrl.replace(/\/$/, '')
        const res = await fetchFn(`${base}/api/stories/${encodeURIComponent(siteKey)}?kind=article&limit=50`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        // the service answers in an envelope, { success, data }, or bare
        const json = (await res.json()) as { data?: { items?: PortalStory[] }; items?: PortalStory[] }
        const items = json.data?.items ?? json.items ?? []
        const portal: JournalSeoEntry[] = []
        for (const s of items) {
          // the list omits bodies; the detail route carries them
          let body = s.body
          if (!body) {
            const full = await fetchFn(`${base}/api/stories/${encodeURIComponent(siteKey)}/${encodeURIComponent(s.slug)}`)
            if (full.ok) {
              const detail = (await full.json()) as { data?: PortalStory } & Partial<PortalStory>
              body = detail.data?.body ?? detail.body
            }
          }
          portal.push({
            slug: s.slug,
            title: s.title,
            date: s.date,
            deck: s.excerpt,
            cover: s.heroImageUrl ? { src: s.heroImageUrl, alt: s.title } : null,
            body,
            source: 'portal',
          })
        }
        const seen = new Set(portal.map((e) => e.slug))
        journalEntries = [...portal, ...bundled.filter((e) => !seen.has(e.slug))].sort((a, b) => b.date.localeCompare(a.date))
      } catch (err) {
        const cause = err instanceof Error ? `${err.message}${(err as { cause?: { message?: string } }).cause?.message ? `: ${(err as { cause?: { message?: string } }).cause?.message}` : ''}` : String(err)
        console.warn(`[seo] journal API unavailable at ${apiUrl} (${cause}); prerendering the bundled entries`)
        journalEntries = bundled
      }
      return journalEntries
    })()
  }
  return entriesCache
}

function blocksHtml(blocks: JournalBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'text') return b.text ? `<p>${esc(b.text)}</p>` : ''
      const imgs = (b.photoIds ?? [])
        .map(photoById)
        .filter((p): p is Photo => Boolean(p))
        .map((p) => `<figure><img src="${esc(p.src)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}"></figure>`)
      return imgs.join('')
    })
    .join('')
}

const entryBody = (e: JournalSeoEntry): string =>
  `<article>${e.cover ? `<figure><img src="${esc(e.cover.src)}" alt="${esc(e.cover.alt)}"></figure>` : ''}<p>${esc(e.date)}</p><h1>${esc(e.title)}</h1><p>${esc(e.deck)}</p>${
    e.blocks ? blocksHtml(e.blocks) : (e.body ?? '')
  }<p>By ${esc(content.photographer)}, ${esc(content.name)}. <a href="/journal">All journal entries</a>.</p></article>`

/**
 * The entry behind a journal page. The build passes it from expand; in the
 * browser the router has only the slug until the page loads its entry and
 * hands it over through useSeoData, so fall back to the bundled post, and to
 * nothing for a portal-only slug, rather than throwing in afterEach.
 */
const entryOf = (ctx: { data?: JournalSeoEntry; params: Record<string, string> }): JournalSeoEntry | undefined =>
  ctx.data ?? journalEntries.find((e) => e.slug === ctx.params.slug)

export const postSeo: RouteSeo<JournalSeoEntry> = {
  expand: async ({ apiUrl, fetch }) => (await loadEntries(apiUrl, fetch)).map((e) => ({ params: { slug: e.slug }, data: e })),
  // a title too long for the brand suffix drops the suffix (module 1.0.1)
  title: (ctx) => entryOf(ctx)?.title ?? 'Journal',
  description: (ctx) => truncate(entryOf(ctx)?.deck ?? '', 160),
  image: (ctx) => {
    const c = entryOf(ctx)?.cover
    return c ? { url: c.src, width: c.w, height: c.h, alt: c.alt } : undefined
  },
  type: 'article',
  // the bundled dates are ordering placeholders; only a portal entry carries a real date
  lastmod: (ctx) => {
    const e = entryOf(ctx)
    return e?.source === 'portal' ? e.date : undefined
  },
  article: (ctx) => {
    const e = entryOf(ctx)
    return e ? { publishedTime: e.date, author: content.photographer, section: 'Journal' } : undefined
  },
  breadcrumb: (ctx) => [{ name: 'Journal', path: '/journal' }, { name: entryOf(ctx)?.title ?? 'Entry' }],
  schema: (ctx) => {
    const e = entryOf(ctx)
    return e
      ? articleNode(ctx.site, {
          path: ctx.path,
          headline: e.title,
          description: e.deck,
          image: e.cover?.src,
          datePublished: e.date,
          author: { name: content.photographer, url: `${ctx.site.siteUrl}/about` },
          section: 'Journal',
        })
      : undefined
  },
  body: (ctx) => {
    const e = entryOf(ctx)
    return e ? entryBody(e) : ''
  },
}

/* ------------------------------ bodies ------------------------------ */

const navHtml = () => `<nav aria-label="Site"><ul>${nav.map((l) => `<li><a href="${esc(l.to)}">${esc(l.label)}</a></li>`).join('')}</ul></nav>`

const categoryOrder = Object.keys(categoryLabels) as PhotoCategory[]

const galleryHtml = (list: Photo[]) =>
  `<ul>${list.map((p) => `<li><figure><img src="${esc(p.thumb)}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" loading="lazy"></figure></li>`).join('')}</ul>`

const homeBody = () =>
  `<main><h1>${esc(content.name)}</h1><p>${esc(content.home.strap)}</p><p>${esc(content.home.tagline)}</p><p>${esc(content.photographer)} · ${esc(content.location)}</p>${navHtml()}<section><h2>The work</h2>${galleryHtml(photos.slice(0, 12))}<p><a href="/work">See all the work</a></p></section></main>`

const workBody = () =>
  `<main><h1>The Work</h1><p>${esc(content.home.strap)}</p>${categoryOrder
    .map((c) => {
      const list = photos.filter((p) => p.category === c)
      return list.length ? `<section><h2>${esc(categoryLabels[c])}</h2>${galleryHtml(list)}</section>` : ''
    })
    .join('')}<p><a href="/rates">Rates</a> · <a href="/contact">Get in touch</a></p></main>`

const money = (n: number) => `$${n.toLocaleString('en-US')}`

const ratesBody = () =>
  `<main><h1>Rates</h1><p>${esc(content.pricing.intro)}</p>${content.pricing.tiers
    .map(
      (t) =>
        `<section id="${esc(t.slug)}"><h2>${esc(t.title)}</h2><p>From ${money(t.from)}</p><p>${esc(t.blurb)}</p><h3>Included</h3><ul>${t.included
          .map((i) => `<li>${esc(i)}</li>`)
          .join('')}</ul>${
          t.addons.length
            ? `<h3>Add-ons</h3><ul>${t.addons.map((a) => `<li>${esc(a.label)}: ${money(a.price)}${a.note ? ` (${esc(a.note)})` : ''}</li>`).join('')}</ul>`
            : ''
        }</section>`,
    )
    .join('')}<p><a href="/contact">Send your ideas</a></p></main>`

const journalBody = () =>
  `<main><h1>Journal</h1><ul>${journalEntries
    .map(
      (e) =>
        `<li><article>${e.cover ? `<img src="${esc(e.cover.src)}" alt="${esc(e.cover.alt)}" loading="lazy">` : ''}<p>${esc(e.date)}</p><h2><a href="/journal/${esc(e.slug)}">${esc(e.title)}</a></h2><p>${esc(e.deck)}</p></article></li>`,
    )
    .join('')}</ul></main>`

const aboutBody = () => {
  const portrait = photoById(content.about.portraitId)
  return `<main><h1>${esc(content.about.heading)}</h1>${
    portrait ? `<figure><img src="${esc(portrait.src)}" alt="${esc(portrait.alt)}" width="${portrait.w}" height="${portrait.h}"><figcaption>${esc(content.about.portraitChip)}</figcaption></figure>` : ''
  }<h2>No niche, no nonsense</h2>${content.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}<blockquote><p>${esc(content.about.pullQuote)}</p></blockquote><p>${esc(content.about.fieldNote)}</p><p><a href="/work">The work</a> · <a href="/contact">Say howdy</a></p></main>`
}

const contactBody = () =>
  `<main><h1>${esc(content.contact.heading)}</h1><p>${esc(content.contact.line)}</p><ul><li>${esc(content.contact.availability)}</li><li>${esc(content.contact.response)}</li><li><a href="${esc(content.instagram)}" rel="noopener">Instagram</a></li></ul><h2>Sessions</h2><ul>${content.contact.sessionTypes
    .map((s) => `<li>${esc(s)}</li>`)
    .join('')}</ul><p><a href="/rates">Rates</a></p></main>`

/* ------------------------------ the table ------------------------------ */

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: {
      seo: {
        description:
          'Muddy Wellies Photography is Ashley Montoya, a documentary photographer in Southern Colorado: portraits, brand shoots, ranch and rodeo work, full of movement.',
        body: homeBody,
      },
    },
  },
  {
    path: '/work',
    name: 'work',
    component: () => import('@/pages/PortfolioPage.vue'),
    meta: {
      seo: {
        title: 'The Work',
        description:
          'Photographs by Ashley Montoya across Southern Colorado: folks and families, small-business branding, ranch and rodeo dust, and the wanderings in between.',
        image: { url: '/photos/web/038-img-2715.webp', width: 1600, height: 1086, alt: 'Neck and neck in the arena' },
        schema: ({ site, path }) =>
          creativeWorkNode(site, {
            path,
            type: 'ImageGallery',
            name: `The Work: photographs by ${content.photographer}`,
            description: content.home.strap,
            image: '/photos/web/038-img-2715.webp',
            extra: {
              hasPart: categoryOrder.map((c) => ({
                '@type': 'ImageGallery',
                name: categoryLabels[c],
                url: `${site.siteUrl}${path}`,
                numberOfItems: photos.filter((p) => p.category === c).length,
              })),
              associatedMedia: photos.map((p) => ({
                '@type': 'ImageObject',
                contentUrl: `${site.siteUrl}${p.src}`,
                thumbnailUrl: `${site.siteUrl}${p.thumb}`,
                width: p.w,
                height: p.h,
                caption: p.alt,
                creator: { '@id': `${site.siteUrl}/#person` },
                copyrightHolder: { '@id': `${site.siteUrl}/#person` },
              })),
            },
          }),
        body: workBody,
      },
    },
  },
  {
    path: '/rates',
    name: 'rates',
    component: () => import('@/pages/PricingPage.vue'),
    meta: {
      seo: {
        title: 'Rates',
        description: truncate(
          `Real numbers for a shoot with Muddy Wellies in Southern Colorado: ${content.pricing.tiers.map((t) => `${t.title} from ${money(t.from)}`).join(', ')}. Add-ons listed, no fine print.`,
          160,
        ),
        // no path per node: the three would share one #service id and collapse to one
        schema: ({ site }) =>
          content.pricing.tiers.map((t) =>
            serviceNode(site, {
              name: `${t.title} photography session`,
              type: 'Photography',
              description: t.blurb,
              areaServed: [content.location],
              offers: { price: t.from, priceCurrency: 'USD', description: `From ${money(t.from)}. ${t.included.join('. ')}.` },
            }),
          ),
        body: ratesBody,
      },
    },
  },
  // before the index on purpose: its expand settles the entry list the index body reads
  { path: '/journal/:slug', name: 'journal-post', component: () => import('@/pages/BlogPostPage.vue'), meta: { seo: postSeo } },
  {
    path: '/journal',
    name: 'journal',
    component: () => import('@/pages/BlogIndexPage.vue'),
    meta: {
      seo: {
        title: 'Journal',
        description:
          'Field notes from Ashley Montoya’s shoots: a rodeo down a dirt road, a love story on a late train, a one-light town bookshop. Southern Colorado and beyond.',
        schema: ({ site, path }) =>
          itemListNode(
            site,
            path,
            'Journal entries from Muddy Wellies Photography',
            journalEntries.map((e) => ({ name: e.title, path: `/journal/${e.slug}`, image: e.cover?.src })),
          ),
        body: journalBody,
      },
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/AboutPage.vue'),
    meta: {
      seo: {
        title: 'About Ashley Montoya',
        description:
          'Ashley Montoya is a nurse by trade and a photographer by obsession, born in the Scottish Highlands and based in rural Southern Colorado. No niche, no nonsense.',
        image: { url: '/photos/web/072-img-7284.webp', width: 1386, height: 1600, alt: 'Ashley, a lamb, and a camera' },
        body: aboutBody,
      },
    },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/pages/ContactPage.vue'),
    meta: {
      seo: {
        title: 'Contact',
        description:
          'Send your ideas and project vibes to Muddy Wellies Photography. Based in Southern Colorado, shooting anywhere the road goes, with replies within 48 hours.',
        body: contactBody,
      },
    },
  },
]

/** The catch-all: a real not-found page, noindex, never a redirect home. */
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/pages/NotFoundPage.vue'),
  meta: { seo: { title: 'Page not found', description: 'That trail is not on muddywelliesphotography.com.', noindex: true } },
}
