import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import * as THREE from 'three'
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

/**
 * Dual-renderer stage for spatial DOM galleries, following the same
 * lifecycle contract as apotome's useGLField: a frame loop that parks when
 * the host scrolls away or the tab hides, resize plumbing, full teardown.
 *
 * Two renderers share one camera. The WebGL layer sits behind (z-index 0,
 * pointer-events none) and carries atmosphere only; the CSS3D layer carries
 * real DOM photo planes, so images stay crisp at any size and click/hover
 * behave like ordinary elements. CSS3D cannot depth-composite with WebGL,
 * which is fine as long as the WebGL content is designed to read as
 * background.
 */
export interface StageContext {
  glRenderer: THREE.WebGLRenderer
  cssRenderer: CSS3DRenderer
  glScene: THREE.Scene
  cssScene: THREE.Scene
  width: number
  height: number
}

export interface StageHooks {
  /** build both scenes; return the shared camera */
  setup: (ctx: StageContext) => THREE.PerspectiveCamera
  /** called on mount and every resize */
  layout: (ctx: StageContext, camera: THREE.PerspectiveCamera) => void
  /** seconds since start; return false to stop the loop */
  paint: (t: number, ctx: StageContext) => void | false
  /** dispose anything setup created */
  teardown?: () => void
}

export function useCss3dStage(host: Ref<HTMLElement | null>, hooks: StageHooks) {
  let stop: (() => void) | null = null

  function build() {
    stop?.()
    const el = host.value
    if (!el) return

    const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    glRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    glRenderer.domElement.style.cssText =
      'position:absolute;inset:0;z-index:0;pointer-events:none;'

    const cssRenderer = new CSS3DRenderer()
    cssRenderer.domElement.style.cssText = 'position:absolute;inset:0;z-index:1;'

    el.appendChild(glRenderer.domElement)
    el.appendChild(cssRenderer.domElement)

    const ctx: StageContext = {
      glRenderer,
      cssRenderer,
      glScene: new THREE.Scene(),
      cssScene: new THREE.Scene(),
      width: el.clientWidth || 1,
      height: el.clientHeight || 1,
    }

    const camera = hooks.setup(ctx)

    function resize() {
      ctx.width = el!.clientWidth || 1
      ctx.height = el!.clientHeight || 1
      camera.aspect = ctx.width / ctx.height
      camera.updateProjectionMatrix()
      glRenderer.setSize(ctx.width, ctx.height, false)
      cssRenderer.setSize(ctx.width, ctx.height)
      hooks.layout(ctx, camera)
    }
    resize()

    // first frame immediately so a parked stage still shows the field
    hooks.paint(0, ctx)
    glRenderer.render(ctx.glScene, camera)
    cssRenderer.render(ctx.cssScene, camera)

    let raf = 0
    let onScreen = true
    let running = true
    const start = performance.now()

    function frame() {
      if (!onScreen || document.hidden || !running) {
        raf = 0
        return
      }
      const result = hooks.paint((performance.now() - start) / 1000, ctx)
      if (result === false) running = false
      glRenderer.render(ctx.glScene, camera)
      cssRenderer.render(ctx.cssScene, camera)
      raf = running ? requestAnimationFrame(frame) : 0
    }
    function play() {
      if (!raf && onScreen && running && !document.hidden) {
        raf = requestAnimationFrame(frame)
      }
    }
    play()

    const onVis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : play())
    document.addEventListener('visibilitychange', onVis)

    const ro = new ResizeObserver(() => {
      resize()
      hooks.paint((performance.now() - start) / 1000, ctx)
      glRenderer.render(ctx.glScene, camera)
      cssRenderer.render(ctx.cssScene, camera)
    })
    ro.observe(el)

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false
        if (!onScreen) {
          cancelAnimationFrame(raf)
          raf = 0
        } else play()
      },
      { threshold: 0.05 },
    )
    io.observe(el)

    stop = () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      io.disconnect()
      hooks.teardown?.()
      glRenderer.dispose()
      for (const child of [glRenderer.domElement, cssRenderer.domElement]) {
        if (child.parentNode === el) el.removeChild(child)
      }
      stop = null
    }
  }

  onMounted(build)
  onBeforeUnmount(() => stop?.())

  return { rebuild: build }
}
