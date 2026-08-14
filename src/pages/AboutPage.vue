<script setup lang="ts">
import { computed } from 'vue'
import { content } from '@/data/site'
import { photos } from '@/data/photos'
import GalleryWall from '@/components/GalleryWall.vue'

// Monograph, not a profile card. The page reads as a sequence — title page,
// then the plate standing alone with its caption, then the prose in a single
// narrow measure — so the photograph is never reduced to a column beside
// body text. Blocks are offset against each other to hold the asymmetry.
const portrait = computed(() => photos.find((p) => p.id === content.about.portraitId))
const outtakes = computed(() => photos.filter((p) => p.category === 'wander').slice(0, 8))

const lead = computed(() => content.about.paragraphs[0] ?? '')
const rest = computed(() => content.about.paragraphs.slice(1))
</script>

<template>
  <main class="about">
    <!-- title page: one line, a great deal of air -->
    <section class="container about-open">
      <h1 class="about-title display">{{ content.about.heading }}</h1>
    </section>

    <!-- the plate: natural ratio, offset right, standing on its own -->
    <section class="container about-plate-row">
      <figure v-if="portrait" class="about-plate" :style="{ '--ar': String(portrait.ar) }" v-reveal>
        <img :src="portrait.src" :alt="portrait.alt" decoding="async" />
        <figcaption class="mono-label">{{ portrait.alt }}</figcaption>
      </figure>
    </section>

    <!-- prose: a single narrow measure, offset left against the plate -->
    <section class="container about-prose">
      <p class="about-lead" v-reveal>{{ lead }}</p>
      <p v-for="(para, i) in rest" :key="i" class="about-para" v-reveal="i * 80">
        {{ para }}
      </p>
      <p class="about-close mono-label" v-reveal>{{ content.about.fieldNote }}</p>
    </section>

    <section class="about-outtakes">
      <GalleryWall :photos="outtakes" :max-cols="4" />
    </section>
  </main>
</template>

<style scoped>
.about { padding-top: var(--header-h); }

.about-open {
  padding-top: clamp(4rem, 12vh, 9rem);
  padding-bottom: clamp(3rem, 8vh, 6rem);
}

.about-title {
  font-size: clamp(2.6rem, 7vw, 6rem);
  max-width: 16ch;
}

/* offset right — the plate gets the air to its left, no text beside it */
.about-plate-row { padding-bottom: clamp(3.5rem, 9vh, 7rem); }

.about-plate {
  --plate-h: clamp(360px, 68vh, 660px);
  width: min(100%, calc(var(--plate-h) * var(--ar)));
  margin-left: auto;
  margin-right: 0;
}

@media (min-width: 900px) {
  .about-plate { margin-right: clamp(0px, 6vw, 5rem); }
}

.about-plate img {
  width: 100%;
  height: auto;
  display: block;
  background: var(--panel);
}

.about-plate figcaption {
  padding-top: 0.9rem;
  color: var(--muted-2);
}

/* mirrored offset: prose sits left, never level with the plate */
.about-prose {
  max-width: 60ch;
  margin-right: auto;
  padding-bottom: clamp(4rem, 10vh, 8rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .about-prose { margin-left: clamp(0px, 8vw, 7rem); }
}

.about-lead {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  line-height: 1.35;
  letter-spacing: 0.005em;
}

.about-para {
  font-size: clamp(1rem, 1.3vw, 1.12rem);
  line-height: 1.9;
  color: var(--muted);
}

.about-close {
  margin-top: 1.2rem;
  line-height: 2;
  color: var(--accent);
}

.about-outtakes { padding: 0 0.3rem 0.3rem; }
</style>
