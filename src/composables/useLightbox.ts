import { reactive } from 'vue'

export interface LightboxImage {
  src: string
  /** Small thumbnail painted instantly while the full image loads. */
  thumb?: string
  /**
   * The photograph's true pixel dimensions. Supplying these lets the viewer
   * size its frame from the ratio alone, so swapping the thumb for the full
   * asset cannot change the layout box mid-animation.
   */
  w?: number
  h?: number
  /** Large display title (e.g. photo name). */
  title?: string
  /** Small mono eyebrow label (e.g. category). */
  label?: string
}

export interface OriginRect {
  top: number
  left: number
  width: number
  height: number
}

// Single shared instance — one <ImageLightbox/> is mounted globally in App.vue
// and any component opens it through these actions.
const state = reactive({
  open: false,
  images: [] as LightboxImage[],
  index: 0,
  origin: null as OriginRect | null,
})

/**
 * `origin` is where the picture appears to grow from. Usually that is the
 * element clicked, but a photograph split across several elements (the wheel
 * wall remaps each one into slices) must pass its own combined rect instead,
 * or the viewer expands out of a sliver.
 */
function openLightbox(
  images: LightboxImage[],
  index: number,
  origin: HTMLElement | OriginRect,
) {
  const r = origin instanceof HTMLElement ? origin.getBoundingClientRect() : origin
  state.origin = { top: r.top, left: r.left, width: r.width, height: r.height }
  state.images = images
  state.index = index
  state.open = true
}

function closeLightbox() {
  state.open = false
}

function step(delta: number) {
  const n = state.images.length
  if (n < 2) return
  state.index = (state.index + delta + n) % n
}

export function useLightbox() {
  return { state, openLightbox, closeLightbox, step }
}
