// One-time ingestion of Ashley's photos from the old Squarespace site.
//
//   node scripts/download-photos.mjs            crawl, download, optimize, manifest
//   node scripts/download-photos.mjs --force    regenerate src/data/photos.ts even if present
//   node scripts/download-photos.mjs --sheet    also emit numbered contact sheets for curation
//
// Raw originals land in scripts/raw/ (gitignored). Optimized variants land in
// public/photos/{web,thumb}/. The manifest is written to src/data/photos.ts and
// is meant to be hand-curated afterward (category + alt); dimensions are canonical.

import { mkdir, readdir, readFile, writeFile, access } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(ROOT, 'scripts', 'raw')
const WEB = path.join(ROOT, 'public', 'photos', 'web')
const THUMB = path.join(ROOT, 'public', 'photos', 'thumb')
const MANIFEST = path.join(ROOT, 'src', 'data', 'photos.ts')

const SITE = 'https://muddywelliesphotography.com'
const CDN_SITE_ID = '6139164726936f370c522b1f'

const PAGES = [
  { url: '/', category: 'wild' },
  { url: '/lets-work-together', category: 'branding' },
  { url: '/about', category: 'folks' },
  { url: '/new-page', category: 'folks' },
  { url: '/prints-1', category: 'wild' },
  { url: '/contact-3', category: 'folks' },
]

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Referer: `${SITE}/`,
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const exists = (p) => access(p).then(() => true, () => false)

/** Pull every squarespace-cdn URL for this site out of a raw HTML document. */
function extractUrls(html) {
  const re = new RegExp(
    `https://images\\.squarespace-cdn\\.com/content/v1/${CDN_SITE_ID}/[^"'\\\\\\s)<>]+`,
    'g',
  )
  const found = html.match(re) ?? []
  return found.map((u) => u.replace(/&amp;/g, '&').replace(/\?.*$/, ''))
}

/** content/v1/<site>/<uuid>/<filename> -> uuid */
function uuidOf(url) {
  const parts = new URL(url).pathname.split('/')
  return parts[4] ?? url
}

function slugOf(url) {
  const name = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'photo')
  return (
    name
      .replace(/\.[a-z0-9]+$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'photo'
  )
}

async function fetchWithRetry(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (res.ok) return res
      if (res.status === 404) throw new Error(`404 ${url}`)
      console.warn(`  ${res.status} on ${url}, retrying`)
    } catch (err) {
      if (i === attempts - 1) throw err
      console.warn(`  ${err.message ?? err}, retrying`)
    }
    await sleep(1200 * (i + 1))
  }
  throw new Error(`failed after ${attempts} attempts: ${url}`)
}

async function crawl() {
  // uuid -> { url, sourcePage, category } - first page wins, so PAGES order
  // sets the provisional category priority.
  const seen = new Map()
  for (const page of PAGES) {
    const res = await fetchWithRetry(`${SITE}${page.url}`)
    const html = await res.text()
    const urls = extractUrls(html)
    let fresh = 0
    for (const u of urls) {
      const id = uuidOf(u)
      if (!seen.has(id)) {
        seen.set(id, { url: u, sourcePage: page.url, category: page.category })
        fresh++
      }
    }
    console.log(`${page.url}: ${urls.length} urls, ${fresh} new`)
    await sleep(400)
  }
  return [...seen.values()]
}

async function download(entries) {
  await mkdir(RAW, { recursive: true })
  let n = 0
  for (const e of entries) {
    n++
    const file = path.join(RAW, `${uuidOf(e.url)}.jpg`)
    e.rawFile = file
    if (await exists(file)) continue
    process.stdout.write(`[${n}/${entries.length}] ${slugOf(e.url)} ... `)
    try {
      const res = await fetchWithRetry(`${e.url}?format=2500w`)
      await pipeline(Readable.fromWeb(res.body), createWriteStream(file))
      console.log('ok')
    } catch (err) {
      console.log(`SKIP (${err.message})`)
      e.failed = true
    }
    await sleep(400)
  }
  return entries.filter((e) => !e.failed)
}

async function optimize(entries) {
  await mkdir(WEB, { recursive: true })
  await mkdir(THUMB, { recursive: true })
  const photos = []
  let i = 0
  for (const e of entries) {
    const id = `${String(i + 1).padStart(3, '0')}-${slugOf(e.url)}`
    const webFile = path.join(WEB, `${id}.webp`)
    const thumbFile = path.join(THUMB, `${id}.webp`)
    try {
      const img = sharp(e.rawFile, { failOn: 'none' }).rotate()
      if (!(await exists(webFile))) {
        await img
          .clone()
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 72 })
          .toFile(webFile)
      }
      if (!(await exists(thumbFile))) {
        await img
          .clone()
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 68 })
          .toFile(thumbFile)
      }
      const meta = await sharp(webFile).metadata()
      photos.push({
        id,
        src: `/photos/web/${id}.webp`,
        thumb: `/photos/thumb/${id}.webp`,
        w: meta.width,
        h: meta.height,
        ar: Number((meta.width / meta.height).toFixed(4)),
        category: e.category,
        alt: `Photograph by Ashley Montoya`,
        sourcePage: e.sourcePage,
      })
      i++
    } catch (err) {
      console.warn(`optimize failed for ${id}: ${err.message}`)
    }
  }
  return photos
}

function manifestSource(photos) {
  const rows = photos
    .map(
      (p) =>
        `  { id: '${p.id}', src: '${p.src}', thumb: '${p.thumb}', w: ${p.w}, h: ${p.h}, ar: ${p.ar}, category: '${p.category}', alt: ${JSON.stringify(p.alt)}, sourcePage: '${p.sourcePage}' },`,
    )
    .join('\n')
  return `// GENERATED by scripts/download-photos.mjs - then hand-curated.
// Edit \`category\` and \`alt\` freely; dimensions are canonical (from sharp).

export type PhotoCategory = 'folks' | 'branding' | 'wild' | 'wander'

export interface Photo {
  id: string
  src: string
  thumb: string
  w: number
  h: number
  /** aspect ratio, w / h */
  ar: number
  category: PhotoCategory
  alt: string
  sourcePage: string
}

export const photos: Photo[] = [
${rows}
]

export const categoryLabels: Record<PhotoCategory, string> = {
  folks: 'Folks',
  branding: 'Branding',
  wild: 'The Wild',
  wander: 'Wanderings',
}
`
}

/** Numbered contact sheets so categories/alt can be assigned by eye. */
async function contactSheets(photos) {
  const COLS = 5
  const CELL = 220
  const PER_SHEET = 30
  const outDir = path.join(ROOT, 'scripts', 'sheets')
  await mkdir(outDir, { recursive: true })
  for (let s = 0; s * PER_SHEET < photos.length; s++) {
    const batch = photos.slice(s * PER_SHEET, (s + 1) * PER_SHEET)
    const rowCount = Math.ceil(batch.length / COLS)
    const composites = []
    for (let j = 0; j < batch.length; j++) {
      const p = batch[j]
      const x = (j % COLS) * CELL
      const y = Math.floor(j / COLS) * CELL
      const thumbBuf = await sharp(path.join(ROOT, 'public', p.thumb))
        .resize(CELL - 20, CELL - 44, { fit: 'inside' })
        .toBuffer()
      composites.push({ input: thumbBuf, left: x + 10, top: y + 10 })
      const label = Buffer.from(
        `<svg width="${CELL}" height="30"><text x="10" y="20" font-family="monospace" font-size="16" fill="#111">${p.id.slice(0, 3)}</text></svg>`,
      )
      composites.push({ input: label, left: x, top: y + CELL - 32 })
    }
    await sharp({
      create: {
        width: COLS * CELL,
        height: rowCount * CELL,
        channels: 3,
        background: { r: 240, g: 238, b: 232 },
      },
    })
      .composite(composites)
      .jpeg({ quality: 80 })
      .toFile(path.join(outDir, `sheet-${s + 1}.jpg`))
    console.log(`sheet-${s + 1}.jpg (${batch.length} thumbs)`)
  }
}

const force = process.argv.includes('--force')
const wantSheets = process.argv.includes('--sheet')

if (!force && (await exists(MANIFEST))) {
  const current = await readFile(MANIFEST, 'utf8')
  if (current.includes("{ id: '")) {
    console.log('Manifest already has entries; rerun with --force to regenerate.')
    if (wantSheets) {
      // still allow sheet generation from the existing public thumbs
      const ids = (await readdir(THUMB)).filter((f) => f.endsWith('.webp'))
      await contactSheets(
        ids.map((f) => ({ id: f.replace('.webp', ''), thumb: `photos/thumb/${f}` })),
      )
    }
    process.exit(0)
  }
}

console.log('Crawlingâ€¦')
const entries = await crawl()
console.log(`\n${entries.length} unique photos found. Downloadingâ€¦`)
const ok = await download(entries)
console.log(`\n${ok.length} downloaded. Optimizingâ€¦`)
const photos = await optimize(ok)
await writeFile(MANIFEST, manifestSource(photos))
console.log(`\nWrote ${photos.length} entries to src/data/photos.ts`)
if (wantSheets) await contactSheets(photos)
