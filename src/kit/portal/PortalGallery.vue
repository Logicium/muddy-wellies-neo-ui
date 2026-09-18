<script setup lang="ts">
/**
 * One gallery, open: the wall, the picks, the lightbox, and prints.
 *
 * The pick count and the limit are the whole interaction. A pick is a
 * request to the service, not local state, so a couple on two phones see
 * the same count. Over the limit with an extra price set, picking carries
 * on and the extras are priced at checkout; without one, it stops.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ApotomeGalleries } from '../galleries'
import type { GalleryImage, GalleryOrderView, GalleryPriceItem, GalleryView } from './types'
import { day, money } from './theme'
import PortalLightbox from './PortalLightbox.vue'
import PortalPrintCart, { type CartLine } from './PortalPrintCart.vue'

const props = defineProps<{ galleries: ApotomeGalleries; id: number }>()
const emit = defineEmits<{ back: [] }>()

const g = ref<GalleryView | null>(null)
const orders = ref<GalleryOrderView[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const lightbox = ref<number | null>(null)
const busy = ref<Set<number>>(new Set())
const cart = ref<CartLine[]>([])
const cartOpen = ref(false)
const downloading = ref<{ done: number; total: number } | null>(null)

const picked = computed(() => new Set((g.value?.selects ?? []).filter((s) => s.kind === 'select').map((s) => s.imageId)))
const pickedImages = computed(() => (g.value?.images ?? []).filter((i) => picked.value.has(i.id)))
const limit = computed(() => g.value?.effectiveLimit ?? null)
const over = computed(() => (limit.value == null ? 0 : Math.max(0, picked.value.size - limit.value)))
const atLimit = computed(() => limit.value != null && picked.value.size >= limit.value && !g.value?.extraImageCents)
const prints = computed<GalleryPriceItem[]>(() => (g.value?.priceList ?? []).filter((p) => p.perImage))
const packages = computed<GalleryPriceItem[]>(() => (g.value?.priceList ?? []).filter((p) => !p.perImage))
const canBuy = computed(() => (g.value?.priceList.length ?? 0) > 0 || (over.value > 0 && !!g.value?.extraImageCents))

async function load() {
  loading.value = true
  const r = await props.galleries.one(props.id)
  if (r.ok) {
    g.value = r.data
    error.value = ''
  } else error.value = r.error
  loading.value = false
  const o = await props.galleries.orders(props.id)
  if (o.ok) orders.value = o.data
}

function paidFromUrl(): number | null {
  if (typeof window === 'undefined') return null
  const n = Number(new URLSearchParams(window.location.search).get('paid'))
  return Number.isFinite(n) && n > 0 ? n : null
}

onMounted(async () => {
  await load()
  if (paidFromUrl()) {
    notice.value = 'Thank you. Your order is in, and a receipt is on its way to your inbox.'
    cart.value = []
    const url = new URL(window.location.href)
    url.searchParams.delete('paid')
    window.history.replaceState(window.history.state, '', url.toString())
  }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function onKey(e: KeyboardEvent) {
  if (lightbox.value == null) return
  if (e.key === 'Escape') lightbox.value = null
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}

function step(d: number) {
  if (!g.value || lightbox.value == null) return
  const n = g.value.images.length
  lightbox.value = (lightbox.value + d + n) % n
}

async function toggle(img: GalleryImage) {
  if (!g.value || busy.value.has(img.id)) return
  const isPicked = picked.value.has(img.id)
  if (!isPicked && atLimit.value) {
    notice.value = `You have picked ${limit.value} of ${limit.value}. Unpick one to choose another.`
    return
  }
  busy.value = new Set([...busy.value, img.id])
  // optimistic, then the truth
  const before = g.value.selects
  g.value = {
    ...g.value,
    selects: isPicked ? before.filter((s) => s.imageId !== img.id) : [...before, { imageId: img.id, kind: 'select', note: null }],
  }
  const r = isPicked ? await props.galleries.unselect(props.id, img.id) : await props.galleries.select(props.id, img.id)
  if (!r.ok) {
    g.value = { ...g.value, selects: before }
    notice.value = r.error
  }
  busy.value = new Set([...busy.value].filter((x) => x !== img.id))
}

function addPrint(img: GalleryImage, price: GalleryPriceItem) {
  const found = cart.value.find((l) => l.sku === price.sku && l.imageId === img.id)
  if (found) found.quantity++
  else cart.value.push({ sku: price.sku, label: price.label + (price.sizeLabel ? ` ${price.sizeLabel}` : ''), imageId: img.id, previewUrl: img.previewUrl, filename: img.filename, quantity: 1, unitCents: price.priceCents })
  cartOpen.value = true
}

function addPackage(price: GalleryPriceItem) {
  const found = cart.value.find((l) => l.sku === price.sku && !l.imageId)
  if (found) found.quantity++
  else cart.value.push({ sku: price.sku, label: price.label, quantity: 1, unitCents: price.priceCents })
  cartOpen.value = true
}

const cartCount = computed(() => cart.value.reduce((n, l) => n + l.quantity, 0))

/**
 * "Download the ones I picked", three at a time. Several hundred land as
 * several hundred files; for a whole shoot a delivery link is still better,
 * and the copy says so.
 */
async function downloadPicked() {
  const list = pickedImages.value.filter((i) => i.downloadUrl)
  if (!list.length || downloading.value) return
  downloading.value = { done: 0, total: list.length }
  const queue = [...list]
  const worker = async () => {
    for (;;) {
      const img = queue.shift()
      if (!img) return
      try {
        const res = await fetch(img.downloadUrl!)
        if (!res.ok) throw new Error()
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = img.filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      } catch {
        notice.value = 'One or more photos did not download. Open them one at a time to try again.'
      }
      if (downloading.value) downloading.value = { ...downloading.value, done: downloading.value.done + 1 }
    }
  }
  await Promise.all([worker(), worker(), worker()])
  downloading.value = null
}

function sizeStyle(i: GalleryImage) {
  return i.width && i.height ? { aspectRatio: `${i.width} / ${i.height}` } : { aspectRatio: '3 / 2' }
}
</script>

<template>
  <div class="ap-gallery">
    <button type="button" class="ap-back ap-mono" @click="emit('back')">← All galleries</button>

    <p v-if="loading" class="ap-mono ap-quiet">Loading</p>
    <p v-else-if="error" class="ap-error" role="alert">{{ error }}</p>

    <template v-else-if="g">
      <header class="ap-gallery-head">
        <div>
          <h2 class="ap-title">{{ g.title }}</h2>
          <p class="ap-mono ap-quiet">
            {{ g.imageCount }} {{ g.imageCount === 1 ? 'photo' : 'photos' }}
            <template v-if="g.shootDate"> · {{ day(g.shootDate) }}</template>
            <template v-if="g.expiresAt"> · available until {{ day(g.expiresAt) }}</template>
          </p>
        </div>
        <div class="ap-actions">
          <span v-if="limit != null" class="ap-count ap-mono" :class="{ over: over > 0 }">
            {{ picked.size }} of {{ limit }} picked<template v-if="over > 0">, {{ over }} extra</template>
          </span>
          <span v-else-if="picked.size" class="ap-count ap-mono">{{ picked.size }} picked</span>
          <button v-if="g.canDownload && pickedImages.some((i) => i.downloadUrl)" type="button" class="ap-btn" :disabled="!!downloading" @click="downloadPicked">
            <template v-if="downloading">{{ downloading.done }} of {{ downloading.total }}</template>
            <template v-else>Download my picks</template>
          </button>
          <button v-if="canBuy" type="button" class="ap-btn ap-btn-solid" @click="cartOpen = true">
            Prints<template v-if="cartCount"> · {{ cartCount }}</template>
          </button>
        </div>
      </header>

      <p v-if="g.message" class="ap-message">{{ g.message }}</p>
      <p v-if="notice" class="ap-notice" role="status">{{ notice }} <button type="button" class="ap-link" @click="notice = ''">Dismiss</button></p>
      <p v-if="over > 0 && g.extraImageCents" class="ap-quiet ap-small">
        Every photo past your {{ limit }} included is {{ money(g.extraImageCents, g.currency) }}, paid at checkout.
      </p>

      <div v-if="packages.length" class="ap-packages">
        <button v-for="p in packages" :key="p.sku" type="button" class="ap-package" @click="addPackage(p)">
          <span class="ap-package-name">{{ p.label }}</span>
          <span v-if="p.description" class="ap-quiet ap-small">{{ p.description }}</span>
          <span class="ap-mono">{{ money(p.priceCents, g.currency) }}</span>
        </button>
      </div>

      <ul class="ap-wall">
        <li v-for="(img, idx) in g.images" :key="img.id" class="ap-tile" :class="{ picked: picked.has(img.id) }">
          <button type="button" class="ap-tile-open" :style="sizeStyle(img)" @click="lightbox = idx">
            <img :src="img.previewUrl" :alt="img.filename" loading="lazy" decoding="async" />
          </button>
          <div class="ap-tile-bar">
            <button type="button" class="ap-pick" :class="{ on: picked.has(img.id) }" :aria-pressed="picked.has(img.id)" :disabled="busy.has(img.id)" @click="toggle(img)">
              <span class="ap-pick-mark" aria-hidden="true"></span>
              {{ picked.has(img.id) ? 'Picked' : 'Pick' }}
            </button>
            <a v-if="img.downloadUrl" :href="img.downloadUrl" class="ap-mono ap-link" download>Download</a>
          </div>
        </li>
      </ul>

      <section v-if="orders.length" class="ap-orders">
        <h3 class="ap-mono ap-quiet">Your orders</h3>
        <ul class="ap-list">
          <li v-for="o in orders" :key="o.id" class="ap-row">
            <span class="ap-col">
              <span>Order #{{ o.id }} <span class="ap-mono ap-quiet">· {{ o.status }}</span></span>
              <span class="ap-quiet ap-small">{{ o.lines.map((l) => `${l.label} × ${l.quantity}`).join(', ') }}</span>
            </span>
            <span class="ap-mono ap-num">{{ money(o.totalCents, o.currency) }}</span>
            <span class="ap-mono ap-quiet">{{ day(o.createdAt) }}</span>
          </li>
        </ul>
      </section>

      <PortalLightbox
        v-if="lightbox != null"
        :image="g.images[lightbox]!"
        :index="lightbox"
        :count="g.images.length"
        :picked="picked.has(g.images[lightbox]!.id)"
        :prints="prints"
        :currency="g.currency"
        @close="lightbox = null"
        @step="step"
        @pick="toggle(g.images[lightbox]!)"
        @print="(p) => addPrint(g!.images[lightbox!]!, p)"
      />

      <PortalPrintCart
        v-if="cartOpen"
        :galleries="galleries"
        :gallery-id="g.id"
        :lines="cart"
        :currency="g.currency"
        :extra-count="over"
        :extra-cents="g.extraImageCents"
        @close="cartOpen = false"
        @update="(l) => (cart = l)"
      />
    </template>
  </div>
</template>

<style scoped>
.ap-gallery {
  font-family: var(--ap-font);
  color: var(--ap-ink);
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ap-quiet {
  color: var(--ap-ink-soft);
}

.ap-small {
  font-size: 0.92rem;
}

.ap-error {
  color: var(--ap-signal);
}

.ap-back {
  border: 0;
  background: none;
  padding: 0;
  margin: 0 0 1.4rem;
  color: var(--ap-ink-soft);
  cursor: pointer;
}

.ap-back:hover {
  color: var(--ap-ink);
}

.ap-gallery-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  margin-bottom: 1rem;
}

.ap-title {
  font-family: var(--ap-font-display, var(--ap-font));
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.1;
  margin: 0 0 0.35rem;
}

.ap-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}

.ap-count {
  color: var(--ap-ink);
}

.ap-count.over {
  color: var(--ap-signal);
}

.ap-btn {
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.6rem 1rem;
  border: 1px solid var(--ap-ink);
  border-radius: var(--ap-radius);
  background: none;
  color: var(--ap-ink);
  cursor: pointer;
}

.ap-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.ap-btn-solid {
  background: var(--ap-accent);
  border-color: var(--ap-accent);
  color: var(--ap-paper);
}

.ap-message {
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 0 1.2rem;
}

.ap-notice {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  background: var(--ap-paper-dim);
  border-radius: var(--ap-radius);
}

.ap-link {
  font: inherit;
  border: 0;
  background: none;
  padding: 0;
  color: var(--ap-ink-soft);
  text-decoration: none;
  cursor: pointer;
}

.ap-link:hover {
  color: var(--ap-ink);
}

.ap-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 0 0 1.4rem;
}

.ap-package {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.8rem 1rem;
  border: var(--ap-line);
  border-radius: var(--ap-radius);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ap-package:hover {
  background: var(--ap-paper-dim);
}

.ap-package-name {
  font-weight: 500;
}

.ap-wall {
  list-style: none;
  margin: 1.4rem 0 0;
  padding: 0;
  columns: 3 16rem;
  column-gap: 1rem;
}

.ap-tile {
  break-inside: avoid;
  margin: 0 0 1rem;
  position: relative;
}

.ap-tile-open {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: var(--ap-paper-dim);
  border-radius: var(--ap-radius);
  overflow: hidden;
  cursor: zoom-in;
}

.ap-tile-open img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ap-tile-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0.1rem 0;
}

.ap-pick {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 0;
  background: none;
  padding: 0;
  color: var(--ap-ink-soft);
  cursor: pointer;
}

.ap-pick-mark {
  width: 0.85rem;
  height: 0.85rem;
  border: 1px solid currentColor;
  border-radius: var(--ap-radius);
}

.ap-pick.on {
  color: var(--ap-ink);
}

.ap-pick.on .ap-pick-mark {
  background: var(--ap-accent);
  border-color: var(--ap-accent);
}

.ap-tile.picked .ap-tile-open {
  outline: 2px solid var(--ap-accent);
  outline-offset: 2px;
}

.ap-orders {
  margin-top: 2.4rem;
}

.ap-orders h3 {
  margin: 0 0 0.6rem;
  font-weight: 400;
}

.ap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: var(--ap-line);
}

.ap-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 1.2rem;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: var(--ap-line);
}

.ap-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ap-num {
  font-variant-numeric: tabular-nums;
  color: var(--ap-ink);
}

@media (max-width: 560px) {
  .ap-wall {
    columns: 2 8rem;
    column-gap: 0.6rem;
  }
  .ap-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
