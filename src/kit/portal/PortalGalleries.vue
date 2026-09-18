<script setup lang="ts">
/**
 * The customer's shelf of galleries, and the one they have open.
 *
 * Reads ?gallery= from the address so a shared link lands on the gallery
 * rather than the shelf, and writes it back when one is opened so a reload
 * comes back to the same place.
 */
import { onMounted, ref } from 'vue'
import type { ApotomeGalleries } from '../galleries'
import type { GallerySummary } from './types'
import { day } from './theme'
import PortalGallery from './PortalGallery.vue'

const props = defineProps<{
  galleries: ApotomeGalleries
  /** the summaries the overview already carried; the shelf shows them without a second read */
  initial?: GallerySummary[]
}>()

const list = ref<GallerySummary[]>(props.initial ?? [])
const openId = ref<number | null>(null)
const error = ref('')

function readUrl(): number | null {
  if (typeof window === 'undefined') return null
  const n = Number(new URLSearchParams(window.location.search).get('gallery'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function writeUrl(id: number | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('gallery', String(id))
  else {
    url.searchParams.delete('gallery')
    url.searchParams.delete('paid')
  }
  window.history.replaceState(window.history.state, '', url.toString())
}

async function reload() {
  const r = await props.galleries.list()
  if (r.ok) list.value = r.data
  else error.value = r.error
}

function open(id: number) {
  openId.value = id
  writeUrl(id)
}

function back() {
  openId.value = null
  writeUrl(null)
  void reload()
}

onMounted(async () => {
  if (!props.initial) await reload()
  const fromUrl = readUrl()
  if (fromUrl) openId.value = fromUrl
})
</script>

<template>
  <div class="ap-galleries">
    <PortalGallery v-if="openId" :galleries="galleries" :id="openId" @back="back" />

    <template v-else>
      <p v-if="error" class="ap-error" role="alert">{{ error }}</p>
      <p v-else-if="!list.length" class="ap-quiet">Your galleries will appear here once they are shared with you.</p>

      <ul v-else class="ap-shelf">
        <li v-for="g in list" :key="g.id">
          <button type="button" class="ap-card" @click="open(g.id)">
            <span class="ap-cover">
              <img v-if="g.coverUrl" :src="g.coverUrl" :alt="g.title" loading="lazy" />
              <span v-else class="ap-cover-blank" aria-hidden="true"></span>
            </span>
            <span class="ap-card-text">
              <span class="ap-card-title">{{ g.title }}</span>
              <span class="ap-mono ap-quiet">
                {{ g.imageCount }} {{ g.imageCount === 1 ? 'photo' : 'photos' }}
                <template v-if="g.shootDate"> · {{ day(g.shootDate) }}</template>
                <template v-if="g.expiresAt"> · until {{ day(g.expiresAt) }}</template>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.ap-galleries {
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

.ap-error {
  margin: 0 0 1rem;
  color: var(--ap-signal);
}

.ap-shelf {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1.6rem 1.2rem;
}

.ap-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ap-cover {
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--ap-paper-dim);
  border-radius: var(--ap-radius);
}

.ap-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.ap-card:hover .ap-cover img {
  transform: scale(1.03);
}

.ap-cover-blank {
  display: block;
  width: 100%;
  height: 100%;
}

.ap-card-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ap-card-title {
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: -0.005em;
}
</style>
