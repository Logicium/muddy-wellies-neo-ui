<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import { useLightbox } from '@/composables/useLightbox'

// Reusable full-screen image viewer. The image grows from the clicked
// element's location to full size via a FLIP transform, and shrinks back on
// close. When a thumb is available it paints instantly and the full-res
// swaps in underneath once loaded.

const { state, closeLightbox, step } = useLightbox()

const mounted = ref(false) // controls the overlay's presence in the DOM
const active = ref(false) // drives the backdrop + chrome fade
const imgEl = ref<HTMLImageElement | null>(null)

const current = computed(() => state.images[state.index])

// thumb-first: displaySrc starts at the thumb (if any) and upgrades to the
// full asset in the background. Keyed by index so paging resets it.
const fullLoaded = ref(false)
const displaySrc = computed(() => {
  const c = current.value
  if (!c) return ''
  return fullLoaded.value || !c.thumb ? c.src : c.thumb
})

let upgrade: HTMLImageElement | null = null
function preloadFull() {
  fullLoaded.value = false
  const c = current.value
  if (!c?.thumb) {
    fullLoaded.value = true
    return
  }
  upgrade = new Image()
  upgrade.onload = () => {
    fullLoaded.value = true
  }
  upgrade.src = c.src
}

const GROW = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'

function flipTransform(finalRect: DOMRect) {
  const o = state.origin
  if (!o) return 'none'
  const sx = o.width / finalRect.width
  const sy = o.height / finalRect.height
  const tx = o.left - finalRect.left
  const ty = o.top - finalRect.top
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`
}

async function growIn() {
  await nextTick()
  const img = imgEl.value
  if (!img) return
  // wait until the image has real dimensions so the final rect is correct
  if (!img.complete || !img.naturalWidth) {
    await new Promise((res) => {
      img.onload = res
      img.onerror = res
    })
  }
  await nextTick()
  const finalRect = img.getBoundingClientRect()
  if (!finalRect.width) return
  img.style.transformOrigin = '0 0'
  img.style.transition = 'none'
  img.style.transform = flipTransform(finalRect)
  void img.offsetHeight // reflow so the "from" frame commits
  active.value = true // fade the backdrop + chrome in
  requestAnimationFrame(() => {
    img.style.transition = GROW
    img.style.transform = 'none'
  })
}

function finishClose() {
  mounted.value = false
  document.documentElement.style.overflow = ''
}

function growOut() {
  const img = imgEl.value
  if (!img) {
    finishClose()
    return
  }
  const finalRect = img.getBoundingClientRect()
  active.value = false
  img.style.transition = GROW
  img.style.transformOrigin = '0 0'
  img.style.transform = flipTransform(finalRect)
  let done = false
  const end = () => {
    if (done) return
    done = true
    finishClose()
  }
  img.addEventListener('transitionend', end, { once: true })
  setTimeout(end, 700) // fallback if transitionend never fires
}

watch(
  () => state.open,
  (open) => {
    if (open) {
      mounted.value = true
      document.documentElement.style.overflow = 'hidden'
      preloadFull()
      growIn()
    } else if (mounted.value) {
      growOut()
    }
  },
)

// When paging between images, reset the transform so the fresh image lays out
// at full size (no lingering FLIP transform from the previous frame).
watch(
  () => state.index,
  () => {
    const img = imgEl.value
    if (img) {
      img.style.transition = 'none'
      img.style.transform = 'none'
    }
    if (state.open) preloadFull()
  },
)

function onKey(e: KeyboardEvent) {
  if (!state.open) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowRight') step(1)
  else if (e.key === 'ArrowLeft') step(-1)
}
window.addEventListener('keydown', onKey)
onUnmounted(() => window.removeEventListener('keydown', onKey))

const counter = computed(() => {
  const n = state.images.length
  const i = state.index + 1
  return `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
})
</script>

<template>
  <Teleport to="body">
    <div v-if="mounted" class="lightbox" :class="{ active }" @click.self="closeLightbox">
      <div class="lb-backdrop" @click="closeLightbox" />

      <header class="lb-bar lb-top">
        <span class="mono-label lb-label">{{ current?.label || 'Muddy Wellies' }}</span>
        <div class="lb-top-right">
          <span class="mono-label lb-counter">{{ counter }}</span>
          <button class="lb-close" aria-label="Close" @click="closeLightbox">
            <span /><span />
          </button>
        </div>
      </header>

      <figure class="lb-stage">
        <img
          ref="imgEl"
          :src="displaySrc"
          :alt="current?.title || ''"
          class="lb-image"
          @click.stop
        />
      </figure>

      <footer class="lb-bar lb-bottom">
        <h2 v-if="current?.title" class="lb-title display">{{ current.title }}</h2>
        <span v-else />
        <div v-if="state.images.length > 1" class="lb-nav">
          <button class="lb-arrow" aria-label="Previous" @click="step(-1)">←</button>
          <button class="lb-arrow" aria-label="Next" @click="step(1)">→</button>
        </div>
      </footer>
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.lb-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.lightbox.active .lb-backdrop { opacity: 1; }

.lb-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: clamp(1rem, 2.5vw, 1.6rem) clamp(1.25rem, 4vw, 3rem);
  color: var(--ink);
  opacity: 0;
  transition: opacity 0.5s ease 0.15s;
}

.lightbox.active .lb-bar { opacity: 1; }

.lb-top { border-bottom: 1px solid var(--line); }
.lb-bottom { border-top: 1px solid var(--line); }

.lb-label { color: var(--accent); }
.lb-counter { color: var(--muted); }

.lb-top-right { display: flex; align-items: center; gap: 1.5rem; }

.lb-close {
  position: relative;
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  cursor: pointer;
  transition: border-color var(--t-ui) ease, background var(--t-ui) ease;
}

.lb-close:hover { border-color: var(--ink); background: color-mix(in srgb, var(--ink) 8%, transparent); }

.lb-close span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 1.5px;
  background: var(--ink);
}
.lb-close span:first-child { transform: translate(-50%, -50%) rotate(45deg); }
.lb-close span:last-child { transform: translate(-50%, -50%) rotate(-45deg); }

.lb-stage {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: clamp(0.5rem, 2vw, 1.5rem) clamp(1rem, 4vw, 3rem);
}

.lb-image {
  display: block;
  max-width: min(94vw, 1500px);
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  will-change: transform;
  box-shadow: 0 40px 120px var(--shadow);
}

.lb-title {
  font-size: clamp(1rem, 2vw, 1.6rem);
  font-weight: 700;
}

.lb-nav { display: flex; gap: 0.6rem; }

.lb-arrow {
  width: 46px;
  height: 46px;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--ink);
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color var(--t-ui) ease, background var(--t-ui) ease, color var(--t-ui) ease;
}

.lb-arrow:hover { border-color: var(--ink); background: var(--ink); color: var(--bg); }

@media (prefers-reduced-motion: reduce) {
  .lb-image { transition: none !important; }
}
</style>
