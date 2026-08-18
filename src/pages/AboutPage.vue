<script setup lang="ts">
import { computed } from 'vue'
import { content } from '@/data/site'
import { photos } from '@/data/photos'
import { useLightbox } from '@/composables/useLightbox'
import GalleryWall from '@/components/GalleryWall.vue'

// An inner spread, not a cover. Four moves, borrowed from the printed
// feature: a full-bleed frame with a short rule and a serif title set into
// it; an article spread with a run-in subhead, drop cap and justified text
// beside the portrait; a solid panel carrying the pull quote and the rest
// of the piece in two columns; and the outtakes to close. No masthead, no
// issue furniture. Photographs run as shot, always.
const { openLightbox } = useLightbox()

const hero = computed(() => photos.find((p) => p.id === content.about.heroId))
const portrait = computed(() => photos.find((p) => p.id === content.about.portraitId))

const outtakes = computed(() =>
  photos
    .filter((p) => p.category === 'wander' && p.id !== content.about.heroId)
    .slice(0, 8),
)

const lead = computed(() => content.about.paragraphs[0] ?? '')
const early = computed(() => content.about.paragraphs.slice(1, 2))
const late = computed(() => content.about.paragraphs.slice(2))

function openPortrait(e: Event) {
  if (!portrait.value) return
  openLightbox(
    [{ src: portrait.value.src, thumb: portrait.value.thumb, title: portrait.value.alt }],
    0,
    e.currentTarget as HTMLElement,
  )
}
</script>

<template>
  <main class="about">
    <!-- full-bleed opener: rule + serif title set into the photograph -->
    <section v-if="hero" class="hero">
      <img class="hero-img" :src="hero.src" :alt="hero.alt" decoding="async" />
      <div class="hero-copy container">
        <span class="hero-rule" aria-hidden="true" />
        <h1 class="hero-title">{{ content.about.heading }}</h1>
      </div>
      <span class="hero-byline mono-label" aria-hidden="true">
        Ashley Montoya · Southern Colorado
      </span>
    </section>

    <!-- the article spread: portrait plate, run-in subhead, drop cap -->
    <section class="container spread-a">
      <div class="plate-col">
        <button
          v-if="portrait"
          class="plate"
          :aria-label="portrait.alt"
          @click="openPortrait"
        >
          <img :src="portrait.src" :alt="portrait.alt" loading="lazy" decoding="async" />
          <span class="plate-card mono-label">{{ content.about.portraitChip }}</span>
        </button>
        <p class="plate-caption mono-label">{{ portrait?.alt }}</p>
      </div>

      <div class="article">
        <h2 class="run-in">No niche, no nonsense</h2>
        <p class="para lead-para" v-reveal>{{ lead }}</p>
        <p v-for="(p, i) in early" :key="i" class="para" v-reveal="80">{{ p }}</p>
      </div>
    </section>

    <!-- the panel spread: pull quote beside the rest of the piece -->
    <section class="panel">
      <div class="container panel-grid">
        <blockquote class="panel-quote" v-reveal>
          <span class="quote-rule" aria-hidden="true" />
          “{{ content.about.pullQuote }}”
        </blockquote>

        <div class="panel-copy">
          <p v-for="(p, i) in late" :key="i" class="para" v-reveal="i * 80">{{ p }}</p>
          <p class="field-note mono-label">{{ content.about.fieldNote }}</p>
        </div>
      </div>
    </section>

    <!-- from the field -->
    <section class="container outtake-head">
      <span class="mono-label">From the field</span>
      <span class="mono-label">{{ outtakes.length }} frames</span>
    </section>
    <section class="about-outtakes">
      <GalleryWall :photos="outtakes" :max-cols="4" surface="flat" />
    </section>
  </main>
</template>

<style scoped>
.about {
  padding-top: var(--header-h);
}

/* ---------- full-bleed opener ---------- */

.hero {
  position: relative;
  height: clamp(440px, 76vh, 800px);
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-copy {
  position: absolute;
  inset: auto 0 clamp(2.2rem, 7vh, 4.5rem) 0;
}

.hero-rule {
  display: block;
  width: 2.4rem;
  height: 2px;
  background: var(--accent);
  margin-bottom: 1.2rem;
}

/* set into the image like print: a fixed light ink, both colorways */
.hero-title {
  font-family: var(--font-display);
  font-weight: 480;
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  line-height: 1;
  color: #f0ebdf;
  text-shadow: 0 1px 24px rgba(0, 0, 0, 0.35);
}

.hero-byline {
  position: absolute;
  right: 0.8rem;
  bottom: clamp(2.2rem, 7vh, 4.5rem);
  writing-mode: vertical-rl;
  font-size: 0.55rem;
  color: rgba(240, 235, 223, 0.75);
}

@media (max-width: 899px) {
  .hero-byline { display: none; }
}

/* ---------- article spread ---------- */

.spread-a {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(2.5rem, 6vw, 6rem);
  padding-block: clamp(3rem, 8vh, 6rem);
  align-items: start;
}

.plate-col { min-width: 0; }

.plate {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: var(--panel);
  cursor: zoom-in;
}

.plate img {
  width: 100%;
  height: auto;
  display: block;
}

/* caption card overlapping the frame's corner, print style */
.plate-card {
  position: absolute;
  left: clamp(-1.6rem, -2vw, -0.8rem);
  bottom: clamp(1.2rem, 4vh, 2.4rem);
  background: var(--accent);
  color: var(--accent-ink);
  padding: 0.6rem 1rem;
  letter-spacing: 0.24em;
}

.plate-caption {
  padding-top: 0.8rem;
  color: var(--muted-2);
}

.article {
  max-width: 48ch;
}

/* run-in section head: part of the article, not floating furniture */
.run-in {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 1.3rem;
}

.para {
  font-size: 0.97rem;
  line-height: 1.85;
  text-align: justify;
  hyphens: auto;
  color: var(--ink);
}

.para + .para { margin-top: 1.3rem; }

.lead-para::first-letter {
  font-family: var(--font-display);
  font-weight: 620;
  font-size: 3.9em;
  line-height: 0.78;
  float: left;
  padding: 0.07em 0.14em 0 0;
}

/* ---------- the panel ---------- */

.panel {
  background: var(--panel);
  padding-block: clamp(3rem, 8vh, 6rem);
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2.5rem, 6vw, 6rem);
}

@media (min-width: 940px) {
  .panel-grid {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-items: start;
  }
}

.panel-quote {
  font-family: var(--font-display);
  font-weight: 420;
  font-size: clamp(1.7rem, 3.4vw, 2.8rem);
  line-height: 1.24;
  max-width: 18ch;
}

.quote-rule {
  display: block;
  width: 2.4rem;
  height: 2px;
  background: var(--accent);
  margin-bottom: 1.3rem;
}

.panel-copy { max-width: 72ch; }

@media (min-width: 1000px) {
  .panel-copy {
    column-count: 2;
    column-gap: clamp(2rem, 3.5vw, 3.4rem);
  }
}

.panel-copy .para {
  margin: 0 0 1.3rem;
  break-inside: avoid-column;
}

.field-note {
  color: var(--muted);
  line-height: 2;
  break-inside: avoid-column;
}

/* ---------- outtakes ---------- */

.outtake-head {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  margin-top: clamp(2.5rem, 6vh, 4.5rem);
  padding-top: 0.7rem;
  padding-bottom: 1.2rem;
  color: var(--muted-2);
}

.about-outtakes { padding: 0 0.3rem 0.3rem; }

/* ---------- small screens ---------- */

@media (max-width: 899px) {
  .spread-a { grid-template-columns: 1fr; }
  .article { max-width: none; }
  .plate-card { left: 0.8rem; }
}
</style>
