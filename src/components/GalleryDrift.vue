<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'
import type { Photo } from '@/data/photos'
import { categoryLabels } from '@/data/photos'
import { useCss3dStage, type StageContext } from '@/composables/useCss3dStage'
import { useLightbox } from '@/composables/useLightbox'
import { useTheme } from '@/composables/useTheme'

// The drifting archive wall. Photos hang in a loose field at three depths;
// drag, wheel, or swipe pans the camera and the field wraps in both axes, so
// the archive goes on forever in every direction. Depth bands move at
// different apparent speeds — parallax does the cinematic work. WebGL behind
// carries dust and fog so the space between photos reads as air, not void.

const props = defineProps<{ photos: Photo[] }>()
const { openLightbox } = useLightbox()
const { theme } = useTheme()

const host = ref<HTMLElement | null>(null)
const hovered = ref('')

// ---- deterministic scatter -------------------------------------------------

function jitter(i: number, salt: number) {
  // cheap seeded pseudo-random in [-1, 1], stable across builds
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

const CELL_X = 560
const CELL_Y = 520
const BANDS = [0, -650, -1300]
const BAND_OPACITY = [1, 0.82, 0.62]
const CAM_Z = 950

interface Plane {
  obj: CSS3DObject
  el: HTMLElement
  baseX: number
  baseY: number
  z: number
  photo: Photo
  index: number
}

let planes: Plane[] = []
let fieldW = 1
let fieldH = 1
let dust: THREE.Points | null = null
let camera: THREE.PerspectiveCamera | null = null

// camera pan state
const target = { x: 0, y: 0 }
const look = { x: 0, y: 0 }
let dragDist = 0

function buildPlanes(ctx: StageContext) {
  const n = props.photos.length
  if (!n) return
  const cols = Math.max(3, Math.round(Math.sqrt(n * 1.4)))
  const rows = Math.ceil(n / cols)
  fieldW = cols * CELL_X
  fieldH = rows * CELL_Y

  planes = props.photos.map((photo, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const band = i % BANDS.length

    const el = document.createElement('div')
    el.className = 'drift-plane'
    const img = document.createElement('img')
    const w = photo.ar >= 1 ? 360 : 260
    const h = Math.round(w / photo.ar)
    img.src = photo.thumb
    img.alt = photo.alt
    img.width = w
    img.height = h
    img.draggable = false
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.opacity = String(BAND_OPACITY[band] ?? 1)
    el.appendChild(img)

    el.dataset.index = String(i)
    el.addEventListener('pointerenter', () => {
      hovered.value = `${photo.id.slice(0, 3)} — ${categoryLabels[photo.category].toLowerCase()}`
    })

    const obj = new CSS3DObject(el)
    const baseX = col * CELL_X + jitter(i, 1) * CELL_X * 0.3
    const baseY = row * CELL_Y + jitter(i, 2) * CELL_Y * 0.3
    const z = (BANDS[band] ?? 0) + jitter(i, 3) * 120
    obj.position.set(baseX, baseY, z)
    obj.matrixAutoUpdate = false
    obj.updateMatrix()
    ctx.cssScene.add(obj)
    return { obj, el, baseX, baseY, z, photo, index: i }
  })
}

function buildDust(ctx: StageContext) {
  const COUNT = 260
  const positions = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = jitter(i, 5) * fieldW
    positions[i * 3 + 1] = jitter(i, 6) * fieldH
    positions[i * 3 + 2] = -Math.abs(jitter(i, 7)) * 1600 + 100
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: theme.value === 'mud' ? 0xe9e2d4 : 0x171410,
    size: 2.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    fog: true,
  })
  dust = new THREE.Points(geo, mat)
  ctx.glScene.add(dust)
}

function applyFog(ctx: StageContext) {
  const bg = getComputedStyle(document.body).backgroundColor
  const c = new THREE.Color(bg)
  ctx.glScene.fog = new THREE.Fog(c, CAM_Z, CAM_Z + 2100)
}

// wrap every plane into the window centered on the camera
function wrapField(camX: number, camY: number) {
  for (const p of planes) {
    const wx = camX + mod(p.baseX - camX + fieldW / 2, fieldW) - fieldW / 2
    const wy = camY + mod(p.baseY - camY + fieldH / 2, fieldH) - fieldH / 2
    if (Math.abs(wx - p.obj.position.x) > 0.5 || Math.abs(wy - p.obj.position.y) > 0.5) {
      p.obj.position.x = wx
      p.obj.position.y = wy
      p.obj.updateMatrix()
    }
  }
}

const mod = (a: number, n: number) => ((a % n) + n) % n

// hide planes far outside the view cone: fewer live compositor layers
function windowPlanes(cam: THREE.PerspectiveCamera) {
  const fovY = (cam.fov * Math.PI) / 180
  for (const p of planes) {
    const dist = CAM_Z - p.z
    const halfH = Math.tan(fovY / 2) * dist + 420
    const halfW = halfH * cam.aspect + 200
    const vis =
      Math.abs(p.obj.position.x - cam.position.x) < halfW &&
      Math.abs(p.obj.position.y - cam.position.y) < halfH
    if (vis !== p.obj.visible) {
      p.obj.visible = vis
      p.el.style.display = vis ? '' : 'none'
    }
  }
}

useCss3dStage(host, {
  setup(ctx) {
    camera = new THREE.PerspectiveCamera(50, 1, 10, 4200)
    camera.position.set(0, 0, CAM_Z)
    buildPlanes(ctx)
    buildDust(ctx)
    applyFog(ctx)
    return camera
  },
  layout() {
    // camera aspect handled by the stage; nothing field-specific on resize
  },
  paint(t, ctx) {
    const cam = camera
    if (!cam) return
    cam.position.x += (target.x - cam.position.x) * 0.08
    cam.position.y += (target.y - cam.position.y) * 0.08
    cam.rotation.y += (look.x * 0.035 - cam.rotation.y) * 0.06
    cam.rotation.x += (-look.y * 0.035 - cam.rotation.x) * 0.06
    wrapField(cam.position.x, cam.position.y)
    windowPlanes(cam)
    if (dust) {
      dust.position.z = Math.sin(t * 0.08) * 60
      const wx = cam.position.x
      const wy = cam.position.y
      dust.position.x = wx - mod(wx, fieldW)
      dust.position.y = wy - mod(wy, fieldH)
    }
    // keep fog in step with a live colorway toggle
    if (themeDirty) {
      applyFog(ctx)
      if (dust) {
        ;(dust.material as THREE.PointsMaterial).color.set(
          theme.value === 'mud' ? 0xe9e2d4 : 0x171410,
        )
      }
      themeDirty = false
    }
  },
  teardown() {
    for (const p of planes) p.el.remove()
    planes = []
    dust?.geometry.dispose()
    ;(dust?.material as THREE.PointsMaterial | undefined)?.dispose()
    dust = null
    camera = null
  },
})

let themeDirty = false
watch(theme, () => {
  themeDirty = true
})

// ---- input: drag / wheel / touch ------------------------------------------

let dragging = false
let lastX = 0
let lastY = 0

function onPointerDown(e: PointerEvent) {
  dragging = true
  dragDist = 0
  lastX = e.clientX
  lastY = e.clientY
  host.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  const rect = host.value?.getBoundingClientRect()
  if (rect) {
    look.x = (e.clientX - rect.left) / rect.width - 0.5
    look.y = (e.clientY - rect.top) / rect.height - 0.5
  }
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  dragDist += Math.abs(dx) + Math.abs(dy)
  lastX = e.clientX
  lastY = e.clientY
  // drag moves the world with the hand: camera goes the other way
  target.x -= dx * 1.6
  target.y += dy * 1.6
}

function onPointerUp(e: PointerEvent) {
  dragging = false
  host.value?.releasePointerCapture(e.pointerId)
  // a still press is a tap: pointer capture retargets the native click to the
  // host, so hit-test the release point ourselves
  if (dragDist > 6) return
  const hit = document
    .elementFromPoint(e.clientX, e.clientY)
    ?.closest<HTMLElement>('.drift-plane')
  if (!hit?.dataset.index) return
  const index = Number(hit.dataset.index)
  openLightbox(
    props.photos.map((p) => ({
      src: p.src,
      thumb: p.thumb,
      label: categoryLabels[p.category],
    })),
    index,
    hit,
  )
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  target.x += e.deltaX * 1.4
  target.y -= e.deltaY * 1.4
}

onMounted(() => {
  const el = host.value
  if (!el) return
  el.addEventListener('wheel', onWheel, { passive: false })
})

onBeforeUnmount(() => {
  host.value?.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div
    ref="host"
    class="drift"
    role="region"
    aria-label="Drifting photo archive. Drag or scroll to wander, click a photo to view it."
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="drift-hud" aria-hidden="true">
      <span class="mono-label hud-hint">drag to wander · click to view</span>
      <span class="mono-label hud-readout">{{ hovered }}</span>
    </div>
  </div>
</template>

<style scoped>
.drift {
  position: relative;
  width: 100%;
  /* the parent decides how much viewport the drift owns */
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  background: var(--bg);
}

.drift:active { cursor: grabbing; }

.drift-hud {
  position: absolute;
  right: var(--gutter);
  bottom: 1.1rem;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  pointer-events: none;
}

.hud-hint { color: var(--muted-2); }
.hud-readout { color: var(--accent); min-height: 1em; }

/* planes are created imperatively — style them globally within the stage */
.drift :deep(.drift-plane) {
  cursor: zoom-in;
  background: var(--panel);
}

.drift :deep(.drift-plane img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  outline: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
}
</style>
