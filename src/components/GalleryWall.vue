<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { Photo } from '@/data/photos'
import { useLightbox } from '@/composables/useLightbox'
import { categoryLabels } from '@/data/photos'

// The wheel wall. The masonry is mounted on the inside of a huge drum whose
// axis runs horizontally in front of the screen; scrolling rotates the drum.
//
// Each photograph is remapped across several slices that each sit on the
// cylinder at their own angle, so the picture itself bends with the surface
// instead of standing on it as a flat facet. That is what closes the seams
// between stacked frames — a real lens curves the image, not just its frame.
//
// Every slice's place on the cylinder is a static transform computed once
// from the manifest aspect ratios. Per scroll frame the browser updates
// exactly ONE transform (the drum's rotation) and the GPU does the rest.
const props = withDefaults(
  defineProps<{
    photos: Photo[]
    /** hero: tighter gaps, no captions — the homepage treatment */
    density?: 'default' | 'hero'
    /** cap column count (hero uses more) */
    maxCols?: number
  }>(),
  { density: 'default', maxCols: 4 },
)

const { openLightbox } = useLightbox()

// ---- shared masonry packing -------------------------------------------------

const width = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)
const stageW = ref(1200)
const viewH = ref(typeof window === 'undefined' ? 900 : window.innerHeight)

const colCount = computed(() => {
  const w = width.value
  const cap = props.maxCols
  if (w < 560) return Math.min(2, cap)
  if (w < 900) return Math.min(3, cap)
  if (w < 1400) return Math.min(4, cap)
  return cap
})

interface Cell {
  photo: Photo
  index: number
}

const columns = computed<Cell[][]>(() => {
  const n = colCount.value
  const cols: Cell[][] = Array.from({ length: n }, () => [])
  const heights = new Array<number>(n).fill(0)
  props.photos.forEach((photo, index) => {
    let best = 0
    for (let i = 1; i < n; i++) {
      if ((heights[i] ?? 0) < (heights[best] ?? 0)) best = i
    }
    cols[best]!.push({ photo, index })
    heights[best] = (heights[best] ?? 0) + 1 / photo.ar
  })
  return cols
})

// ---- the wheel --------------------------------------------------------------

const R = 1900 // drum radius in px: smaller = tighter curl
const PERSP = 1100 // must match .wheel-stage's perspective
// how far the whole wheel sits back in the page. Everything renders smaller,
// so the curved arc is seen whole instead of swelling past the viewport.
const Z_PUSH = 115
const GAP = 10
// target height of one remapped slice: smaller bends the picture more
// faithfully, at the cost of more (static) elements
const SLICE = 120
// slices overlap so neither sub-pixel rounding nor the antialiased edge of a
// rotated plane can show a hairline where two slices of one photo meet
const OVERLAP = 3

const drumOn = ref(false)

interface Slice {
  key: string
  index: number
  photo: Photo
  /** the first slice of a photo carries the label and the focus ring */
  first: boolean
  x: number
  w: number
  h: number
  /** offset of the photo inside this slice's window */
  imgTop: number
  imgH: number
  phi: number
  z: number
}

const layout = computed<{ slices: Slice[]; totalH: number }>(() => {
  const n = colCount.value
  const gap = props.density === 'hero' ? 5 : GAP
  const colW = (stageW.value - gap * (n - 1)) / n
  const ys = new Array<number>(n).fill(0)
  const slices: Slice[] = []

  columns.value.forEach((col, c) => {
    for (const cell of col) {
      const h = colW / cell.photo.ar
      const y = ys[c] ?? 0
      const parts = Math.min(7, Math.max(1, Math.round(h / SLICE)))
      const sh = h / parts

      for (let k = 0; k < parts; k++) {
        // overlap inward only — never past the photo's own edges
        const up = k > 0 ? OVERLAP / 2 : 0
        const down = k < parts - 1 ? OVERLAP / 2 : 0
        const elH = sh + up + down
        const inPhoto = k * sh - up
        slices.push({
          key: `${cell.photo.id}-${k}`,
          index: cell.index,
          photo: cell.photo,
          first: k === 0,
          x: c * (colW + gap),
          w: colW,
          h: elH,
          imgTop: -inPhoto,
          imgH: h,
          phi: (y + inPhoto + elH / 2) / R,
          // inscribed chord: both edges land exactly on the circle
          z: Math.sqrt(Math.max(1, R * R - (elH / 2) ** 2)),
        })
      }
      ys[c] = y + h + gap
    }
  })

  return { slices, totalH: Math.max(...ys, 1) }
})

// the flat tangent line sits a little below the stage's top edge — the stage
// itself is pinned under the header, so that band of flat, undistorted frames
// is the first thing the eye lands on before the wall curls away
const tangentY = computed(() => Math.min(130, viewH.value * 0.15))

// A sticky container's scroll budget is always (its own height) + (however
// long it stays pinned) — so once the drum has finished rotating, the box
// still has to slide the rest of its own height out of the way before
// what's next can appear. A full stageH tail (~800px) made that closing
// stretch read as a dead blank gap. A short settle buffer instead ends the
// section right after the drum finishes; the last row or two land a hair
// shy of dead-flat, which is invisible since they're already fading into
// the lens blur down there.
const TAIL = 140
const wrapH = computed(() => layout.value.totalH - tangentY.value + TAIL)

// what a frame at the tangent actually measures on screen, for `sizes`
const shownW = computed(() =>
  Math.round(((stageW.value / colCount.value) * PERSP) / (PERSP + Z_PUSH)),
)

const wrapEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const drumEl = ref<HTMLElement | null>(null)
const stageH = ref(800)

let theta = 0
let raf = 0
let ro: ResizeObserver | null = null
let lastW = 0

function measure() {
  width.value = window.innerWidth
  viewH.value = window.innerHeight
  const wrap = wrapEl.value
  if (wrap?.clientWidth) {
    stageW.value = wrap.clientWidth
    lastW = wrap.clientWidth
  }
  // the stage's height is set in CSS (viewport minus the header); read it
  // back rather than restating the arithmetic here
  if (stageEl.value?.clientHeight) stageH.value = stageEl.value.clientHeight
}

function thetaTarget() {
  // The flat line sits tangentY below the stage's own top edge — wherever
  // sticky has currently parked it. Reading both live rects keeps the mapping
  // honest before, during and after pinning, and self-corrects for anything
  // that moved the page (route transitions, content above changing height).
  const wrap = wrapEl.value
  const stage = stageEl.value
  if (!wrap || !stage) return theta
  const front =
    stage.getBoundingClientRect().top + tangentY.value - wrap.getBoundingClientRect().top
  return Math.max(0, Math.min(layout.value.totalH, front)) / R
}

function frame() {
  raf = 0
  const drum = drumEl.value
  if (!drum) return
  const t = thetaTarget()
  theta += (t - theta) * 0.14
  if (Math.abs(t - theta) > 0.00015) raf = requestAnimationFrame(frame)
  // concave: the axis sits in FRONT of the tangent, so we ride the inside
  // of the wheel — rows below curve up toward the viewer. Z_PUSH sinks the
  // whole wheel into the page.
  drum.style.transform = `translateZ(${R - Z_PUSH}px) rotateX(${(-theta).toFixed(5)}rad)`
}

function wake() {
  if (!raf && drumOn.value) raf = requestAnimationFrame(frame)
}

const onResize = () => {
  measure()
  wake()
}

onMounted(async () => {
  const fine =
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  drumOn.value = fine
  if (!fine) return
  // the stage only exists after the v-if renders — measuring before that
  // leaves the whole wall laid out at the placeholder width
  await nextTick()
  measure()
  // walls shorter than a viewport don't earn a drum
  if (layout.value.totalH < viewH.value * 0.9) {
    drumOn.value = false
    return
  }
  // start settled at the current scroll position rather than spinning in
  theta = thetaTarget()
  wake()
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  // width can change without a window resize (scrollbar, layout above it);
  // guard on width alone so our own height writes can't feed back
  ro = new ResizeObserver(() => {
    const w = wrapEl.value?.clientWidth ?? 0
    if (!w || Math.abs(w - lastW) < 1) return
    measure()
    wake()
  })
  if (wrapEl.value) ro.observe(wrapEl.value)
})

onUnmounted(() => {
  window.removeEventListener('scroll', wake)
  window.removeEventListener('resize', onResize)
  ro?.disconnect()
  cancelAnimationFrame(raf)
})

// static placement on the cylinder — computed once per layout, never per frame
function sliceStyle(s: Slice) {
  return {
    left: `${s.x.toFixed(1)}px`,
    width: `${s.w.toFixed(1)}px`,
    height: `${s.h.toFixed(2)}px`,
    top: `${tangentY.value.toFixed(1)}px`,
    marginTop: `${(-s.h / 2).toFixed(2)}px`,
    transform: `rotateX(${s.phi.toFixed(5)}rad) translateZ(${(-s.z).toFixed(1)}px)`,
  }
}

function imgStyle(s: Slice) {
  return { top: `${s.imgTop.toFixed(2)}px`, height: `${s.imgH.toFixed(1)}px` }
}

function openFrom(index: number, el: HTMLElement) {
  openLightbox(
    props.photos.map((p) => ({
      src: p.src,
      thumb: p.thumb,
      title: p.alt === 'Photograph by Ashley Montoya' ? undefined : p.alt,
      label: categoryLabels[p.category],
    })),
    index,
    el,
  )
}

// one delegated listener for the whole drum, whatever slice was hit
function onDrumClick(e: MouseEvent) {
  const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.wheel-slice')
  if (!el?.dataset.index) return
  openFrom(Number(el.dataset.index), el)
}

function onFlatClick(index: number, e: Event) {
  openFrom(index, e.currentTarget as HTMLElement)
}
</script>

<template>
  <!-- the wheel: sticky stage, one rotating drum, static remapped slices -->
  <div v-if="drumOn" ref="wrapEl" class="wheel-wrap" :style="{ height: `${wrapH}px` }">
    <div ref="stageEl" class="wheel-stage" :style="{ perspectiveOrigin: `50% ${tangentY}px` }">
      <!-- the drum must pivot about the tangent line, same as the slices and
           the projection origin — three anchors, one height -->
      <div
        ref="drumEl"
        class="wheel-drum"
        :style="{ transformOrigin: `50% ${tangentY}px` }"
        @click="onDrumClick"
      >
        <component
          :is="s.first ? 'button' : 'div'"
          v-for="s in layout.slices"
          :key="s.key"
          class="wheel-slice"
          :data-index="s.index"
          :aria-label="s.first ? s.photo.alt : undefined"
          :aria-hidden="s.first ? undefined : 'true'"
          :style="sliceStyle(s)"
        >
          <img
            class="slice-img"
            :src="s.photo.thumb"
            :srcset="`${s.photo.thumb} 400w, ${s.photo.src} 1600w`"
            :sizes="`${shownW}px`"
            :style="imgStyle(s)"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </component>
      </div>

      <!-- depth of field: the far edge of the lens falls out of focus -->
      <div class="lens-blur" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  </div>

  <!-- flat wall: touch, reduced motion, and walls too short for the drum -->
  <div v-else class="wall" :class="[`density-${density}`]" :style="{ '--cols': colCount }">
    <div v-for="(col, c) in columns" :key="c" class="wall-col">
      <button
        v-for="cell in col"
        :key="cell.photo.id"
        class="wall-cell"
        v-reveal="(cell.index % colCount) * 70"
        :aria-label="cell.photo.alt"
        @click="onFlatClick(cell.index, $event)"
      >
        <span class="cell-inner">
          <img
            :src="cell.photo.thumb"
            :srcset="`${cell.photo.thumb} 400w, ${cell.photo.src} 1600w`"
            sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
            :alt="cell.photo.alt"
            loading="lazy"
            decoding="async"
            :style="{ aspectRatio: String(cell.photo.ar) }"
          />
          <span v-if="density === 'default'" class="cell-tag mono-label" aria-hidden="true">
            {{ cell.photo.id.slice(0, 3) }} · {{ categoryLabels[cell.photo.category] }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ---------- the wheel ---------- */

.wheel-wrap {
  position: relative;
}

/* pinned below the fixed header, so the flat band at the tangent is visible
   instead of sliding underneath the chrome */
.wheel-stage {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow: hidden;
  perspective: 1100px;
}

.wheel-drum {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

.wheel-slice {
  position: absolute;
  display: block;
  padding: 0;
  border: none;
  background: none;
  overflow: hidden;
  cursor: zoom-in;
  backface-visibility: hidden;
}

.wheel-slice:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.slice-img {
  position: absolute;
  left: 0;
  width: 100%;
  object-fit: cover;
  display: block;
}

/* Progressive blur along the bottom of the lens: four stacked backdrop
   filters, each blurring harder but masked to a shorter reach, so focus falls
   away deepest at the very edge and has recovered by the top of the strip.
   A single masked layer would ramp its opacity, not its focus — the stack is
   what makes it read as depth of field. */
.lens-blur {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  /* the mask stops below are percentages of this height, so shrinking it
     pulls the whole effect in toward the edge without touching how hard
     any single layer blurs */
  height: 24vh;
  z-index: 5;
  pointer-events: none;
}

.lens-blur span {
  position: absolute;
  inset: 0;
  display: block;
}

.lens-blur span:nth-child(1) {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  mask-image: linear-gradient(to top, #000 0%, #000 26%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, #000 0%, #000 26%, transparent 100%);
}

.lens-blur span:nth-child(2) {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  mask-image: linear-gradient(to top, #000 0%, #000 14%, transparent 62%);
  -webkit-mask-image: linear-gradient(to top, #000 0%, #000 14%, transparent 62%);
}

.lens-blur span:nth-child(3) {
  backdrop-filter: blur(11px);
  -webkit-backdrop-filter: blur(11px);
  mask-image: linear-gradient(to top, #000 0%, #000 6%, transparent 36%);
  -webkit-mask-image: linear-gradient(to top, #000 0%, #000 6%, transparent 36%);
}

.lens-blur span:nth-child(4) {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  mask-image: linear-gradient(to top, #000 0%, transparent 17%);
  -webkit-mask-image: linear-gradient(to top, #000 0%, transparent 17%);
}

/* ---------- the flat wall ---------- */

.wall {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: var(--wall-gap, 0.55rem);
  align-items: start;
}

.density-hero { --wall-gap: 0.3rem; }

.wall-col {
  display: flex;
  flex-direction: column;
  gap: var(--wall-gap, 0.55rem);
  min-width: 0;
}

.wall-cell {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
}

.cell-inner {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  background: var(--panel);
  overflow: hidden;
}

.wall-cell img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 1.1s var(--ease-out);
}

.wall-cell:hover img { transform: scale(1.04); }

.cell-tag {
  position: absolute;
  left: 0.7rem;
  bottom: 0.55rem;
  z-index: 2;
  font-size: 0.55rem;
  color: #fff;
  mix-blend-mode: difference;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--t-ui) ease, transform var(--t-ui) ease;
  pointer-events: none;
}

.wall-cell:hover .cell-tag { opacity: 0.9; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .wall-cell img, .wall-cell:hover img { transform: none; transition: none; }
}
</style>
