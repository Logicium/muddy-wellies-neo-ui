<script setup lang="ts">
import { computed, ref } from 'vue'
import { content, type PricingTier } from '@/data/site'
import { photos, type Photo } from '@/data/photos'
import { useLightbox } from '@/composables/useLightbox'
import { categoryLabels } from '@/data/photos'

// Rate spreads, art-directed one to a tier.
//
// Every band runs the full viewport width and each frame's width comes from
// its own aspect ratio, so a band's height is `viewportWidth / sum(ratios)`.
// Curating each set to sum near 2.9 is what keeps these bands around half a
// screen tall — a band summing to 1.5 would stand taller than the viewport.
//
// Photographs run as shot — no filters. The art direction lives entirely in
// the composition of each band:
//
//   inset     a spread with a small detail frame laid into it. Paging to
//             another set slides the spread in from one side and the detail
//             in from the other.
//   register  a standing frame, a wide frame, a standing frame — a measured
//             row that reads across like a proof sheet.
//   serial    a run of four portraits, shoulder to shoulder.

const emit = defineEmits<{ build: [slug: string] }>()
const { openLightbox } = useLightbox()

const tiers = content.pricing.tiers
const open = ref<string>(tiers[0]?.slug ?? '')
/** which set of the 'inset' composition is on screen, per tier */
const activeSet = ref<Record<string, number>>(
  Object.fromEntries(tiers.map((t) => [t.slug, 0])),
)

const byId = computed(() => new Map(photos.map((p) => [p.id, p])))
const photo = (id: string) => byId.value.get(id)
const ar = (id: string) => photo(id)?.ar ?? 1.5

function currentSet(tier: PricingTier) {
  return tier.sets[activeSet.value[tier.slug] ?? 0] ?? tier.sets[0]!
}

/** frames currently in the band, inset last */
function framesOf(tier: PricingTier): Photo[] {
  const set = currentSet(tier)
  const ids = [...set.mains, ...(set.inset ? [set.inset] : [])]
  return ids.map(photo).filter((p): p is Photo => !!p)
}

/**
 * The band's aspect ratio. Fixed per tier from its first set so paging
 * between sets never changes the band's height.
 */
function bandRatio(tier: PricingTier) {
  const first = tier.sets[0]
  if (!first) return 2.9
  return first.mains.reduce((s, id) => s + ar(id), 0) || 2.9
}

function openFrame(tier: PricingTier, index: number, e: Event) {
  const list = framesOf(tier)
  openLightbox(
    list.map((p) => ({
      src: p.src,
      thumb: p.thumb,
      title: p.alt,
      label: categoryLabels[p.category],
    })),
    index,
    e.currentTarget as HTMLElement,
  )
}

function toggle(slug: string) {
  open.value = open.value === slug ? '' : slug
}

const pad = (n: number) => String(n).padStart(2, '0')
const dollars = (n: number) => `$${n.toLocaleString()}`
</script>

<template>
  <div class="spreads">
    <article
      v-for="(tier, i) in tiers"
      :key="tier.slug"
      class="spread"
      :class="[`comp-${tier.composition}`, { open: open === tier.slug }]"
    >
      <!-- ---------- the band ---------- -->
      <div class="band" :style="{ '--band-ar': String(bandRatio(tier)) }" v-reveal>
        <!-- inset: a spread with a detail frame laid into it -->
        <template v-if="tier.composition === 'inset'">
          <Transition name="mains">
            <div class="mains" :key="activeSet[tier.slug]">
              <button
                v-for="(id, k) in currentSet(tier).mains"
                :key="id"
                class="plate"
                :style="{ '--ar': String(ar(id)) }"
                :aria-label="photo(id)?.alt"
                @click="openFrame(tier, k, $event)"
              >
                <img
                  :src="photo(id)!.src"
                  :alt="photo(id)!.alt"
                  :loading="i === 0 ? 'eager' : 'lazy'"
                  decoding="async"
                />
              </button>
            </div>
          </Transition>

          <Transition name="detail">
            <button
              v-if="currentSet(tier).inset"
              :key="activeSet[tier.slug]"
              class="detail-plate"
              :style="{ '--ar': String(ar(currentSet(tier).inset!)) }"
              :aria-label="photo(currentSet(tier).inset!)?.alt"
              @click="openFrame(tier, currentSet(tier).mains.length, $event)"
            >
              <img
                :src="photo(currentSet(tier).inset!)!.src"
                :alt="photo(currentSet(tier).inset!)!.alt"
                loading="lazy"
                decoding="async"
              />
            </button>
          </Transition>
        </template>

        <!-- register / serial: a measured row -->
        <template v-else>
          <button
            v-for="(id, k) in currentSet(tier).mains"
            :key="id"
            class="plate"
            :style="{ '--ar': String(ar(id)) }"
            :aria-label="photo(id)?.alt"
            @click="openFrame(tier, k, $event)"
          >
            <img
              :src="photo(id)!.src"
              :alt="photo(id)!.alt"
              :loading="i === 0 ? 'eager' : 'lazy'"
              decoding="async"
            />
          </button>
        </template>
      </div>

      <!-- ---------- caption + set pager ---------- -->
      <div class="band-foot">
        <p class="plate-caption mono-label">
          <span v-for="(p, j) in framesOf(tier)" :key="p.id">
            <span v-if="j" class="cap-sep" aria-hidden="true">·</span>{{ p.alt }}
          </span>
        </p>

        <div v-if="tier.sets.length > 1" class="pager" role="group" aria-label="Change spread">
          <button
            v-for="(s, k) in tier.sets"
            :key="k"
            class="pager-dot mono-label"
            :class="{ on: (activeSet[tier.slug] ?? 0) === k }"
            :aria-current="(activeSet[tier.slug] ?? 0) === k"
            :aria-label="`Spread ${k + 1}`"
            @click="activeSet[tier.slug] = k"
          >
            {{ pad(k + 1) }}
          </button>
        </div>
      </div>

      <!-- ---------- head + collapsible detail ---------- -->
      <button class="spread-head" :aria-expanded="open === tier.slug" @click="toggle(tier.slug)">
        <span class="head-num mono-label">{{ pad(i + 1) }}</span>
        <h2 class="spread-title display">{{ tier.title }}</h2>
        <span class="head-price mono-label">from {{ dollars(tier.from) }}</span>
        <span class="head-cue" aria-hidden="true">{{ open === tier.slug ? '−' : '+' }}</span>
      </button>

      <div class="spread-body">
        <div class="spread-body-inner">
          <div class="body-grid">
            <div class="spread-lede">
              <p class="spread-blurb">{{ tier.blurb }}</p>
              <button class="spread-build mono-label" @click="emit('build', tier.slug)">
                Build this one below <span aria-hidden="true">↓</span>
              </button>
            </div>

            <div class="spread-spec">
              <span class="spec-head mono-label">What’s included</span>
              <!-- every line carries the same value, so a leader would only be
                   filler — the list stands on its own -->
              <ul class="spec-list">
                <li v-for="item in tier.included" :key="item">{{ item }}</li>
              </ul>

              <template v-if="tier.addons.length">
                <span class="spec-head mono-label spec-head-2">Add-ons</span>
                <div class="ledger">
                  <div v-for="a in tier.addons" :key="a.label" class="ledger-line">
                    <span class="ledger-label">
                      {{ a.label }}
                      <em v-if="a.note" class="ledger-note mono-label">{{ a.note }}</em>
                    </span>
                    <span class="ledger-dots" />
                    <span class="ledger-value mono-label accent">+{{ dollars(a.price) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.spreads {
  display: flex;
  flex-direction: column;
  gap: clamp(4rem, 10vw, 8rem);
}

/* ---------- the band ---------- */

/* breaks out of the page container to run the full viewport width; the body
   already hides horizontal overflow, so 100vw is safe here. The ratio is
   fixed per tier, which is what keeps the height stable while paging. */
.band {
  /* frames butt edge to edge — one continuous surface, no gutters */
  --plate-gap: 0px;
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  aspect-ratio: var(--band-ar);
  display: flex;
  gap: var(--plate-gap);
}

.mains {
  position: absolute;
  inset: 0;
  display: flex;
  gap: var(--plate-gap);
}

.plate {
  /* grow in proportion to the photo's own ratio, so every frame in the band
     resolves to the same height */
  flex-grow: var(--ar);
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  background: var(--panel);
  overflow: hidden;
  cursor: zoom-in;
}

.plate img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 1.4s var(--ease-out);
}

.plate:hover img { transform: scale(1.02); }

/* ---------- the inset detail ---------- */

.detail-plate {
  /* dead centre of the band, both axes: inset 0 + auto margins, so the
     paging transition's transform stays free for the slide animation */
  position: absolute;
  inset: 0;
  margin: auto;
  z-index: 3;
  width: clamp(96px, 13%, 260px);
  aspect-ratio: var(--ar);
  padding: 0;
  border: none;
  background: var(--panel);
  overflow: hidden;
  cursor: zoom-in;
  /* the frame is what separates it from the photograph behind */
  outline: clamp(4px, 0.5vw, 9px) solid var(--bg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.detail-plate img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 1.4s var(--ease-out);
}

.detail-plate:hover img { transform: scale(1.04); }

/* the spread arrives from one side, the detail from the other */
.mains-enter-active,
.mains-leave-active,
.detail-enter-active,
.detail-leave-active {
  transition: transform 0.9s var(--ease-out), opacity 0.6s ease;
}

.mains-enter-from { transform: translateX(16%); opacity: 0; }
.mains-leave-to { transform: translateX(-12%); opacity: 0; }

.detail-enter-from { transform: translateX(-70%); opacity: 0; }
.detail-leave-to { transform: translateX(70%); opacity: 0; }

/* ---------- caption + pager ---------- */

.band-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2rem;
  padding-top: 1rem;
}

.plate-caption {
  color: var(--muted-2);
  line-height: 1.9;
}

.cap-sep { padding: 0 0.5rem; }

.pager {
  display: flex;
  gap: 0.9rem;
  flex: none;
}

.pager-dot {
  background: none;
  border: none;
  padding: 0.2rem 0;
  color: var(--muted-2);
  cursor: pointer;
  position: relative;
}

.pager-dot:hover { color: var(--ink); }
.pager-dot.on { color: var(--accent); }

.pager-dot.on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.3rem;
  height: 1px;
  background: var(--accent);
}

/* ---------- head ---------- */

.spread-head {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: baseline;
  gap: clamp(0.9rem, 2.4vw, 2rem);
  padding: clamp(0.8rem, 2vw, 1.4rem) 0 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.head-num { color: var(--muted-2); }

.spread-title {
  font-size: clamp(2rem, 4.6vw, 3.6rem);
  transition: color var(--t-ui) ease;
}

.spread-head:hover .spread-title { color: var(--accent); }

.head-price { color: var(--accent); white-space: nowrap; }

.head-cue {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--muted);
  transition: color var(--t-ui) ease;
}

.spread-head:hover .head-cue { color: var(--ink); }

/* ---------- collapsible detail ---------- */

/* unfold via the 0fr -> 1fr grid trick: no measured heights */
.spread-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.55s var(--ease-out);
}

.spread.open .spread-body { grid-template-rows: 1fr; }

.spread-body-inner {
  overflow: hidden;
  visibility: hidden;
  transition: visibility 0s 0.55s;
}

.spread.open .spread-body-inner {
  visibility: visible;
  transition: visibility 0s;
}

.body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  padding-top: clamp(1.6rem, 3.5vw, 2.6rem);
}

/* asymmetric measure: the lead holds the left, the spec sits in the margin */
@media (min-width: 940px) {
  .body-grid {
    grid-template-columns: 1.15fr 1fr;
    gap: clamp(3rem, 7vw, 6rem);
    align-items: start;
  }
}

.spread-lede {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  align-items: flex-start;
}

/* the opening paragraph carries the display face, magazine style */
.spread-blurb {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.15rem, 1.9vw, 1.6rem);
  line-height: 1.45;
  max-width: 34ch;
  color: var(--ink);
}

.spread-build {
  padding: 0.75rem 1.4rem;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.spread-build:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.spec-head {
  display: block;
  color: var(--muted-2);
  margin-bottom: 1.1rem;
}

.spec-head-2 { margin-top: 2.2rem; }

.spec-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.spec-list li {
  font-size: 0.95rem;
  padding-left: 1.1rem;
  position: relative;
}

.spec-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.62em;
  width: 5px;
  height: 1px;
  background: var(--accent);
}

.ledger {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.ledger-line {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}

.ledger-label {
  font-size: 0.95rem;
  white-space: nowrap;
}

.ledger-note { font-style: normal; margin-left: 0.5rem; font-size: 0.55rem; color: var(--muted-2); }

.ledger-dots {
  flex: 1;
  border-bottom: 1px dotted var(--line-strong);
  transform: translateY(-0.25em);
}

.ledger-value { white-space: nowrap; }
.ledger-value.accent { color: var(--accent); }

@media (max-width: 720px) {
  .band-foot { flex-direction: column; gap: 0.8rem; }
  .detail-plate { width: 22%; }
}

@media (prefers-reduced-motion: reduce) {
  .plate img,
  .detail-plate img { transition: none; }
  .plate:hover img,
  .detail-plate:hover img { transform: none; }
  .mains-enter-active,
  .mains-leave-active,
  .detail-enter-active,
  .detail-leave-active { transition: opacity 0.3s ease; }
  .mains-enter-from,
  .mains-leave-to,
  .detail-enter-from,
  .detail-leave-to { transform: none; }
}
</style>
