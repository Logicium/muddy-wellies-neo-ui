<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { content } from '@/data/site'
import { photos } from '@/data/photos'
import GalleryWall from '@/components/GalleryWall.vue'
import MuddyIntro from '@/components/MuddyIntro.vue'

// The homepage IS the drift: the archive floats in 3D behind the name, and
// visitors wander it before they've clicked anything. Touch-first small
// screens and reduced-motion visitors get the flat wall instead.
const GalleryDrift = defineAsyncComponent(() => import('@/components/GalleryDrift.vue'))

const useDrift = ref(false)
onMounted(() => {
  const coarseSmall =
    window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useDrift.value = !coarseSmall && !reduced
})
</script>

<template>
  <main class="home">
    <MuddyIntro />

    <section v-if="useDrift" class="home-hero" aria-label="Photography archive">
      <GalleryDrift :photos="photos" />
      <div class="hero-scrim" aria-hidden="true" />
      <div class="hero-brand">
        <h1 class="display hero-title">Muddy<br />Wellies</h1>
        <p class="mono-label hero-strap">{{ content.home.strap }}</p>
        <router-link to="/work" class="btn solid hero-cta">
          Wade in <span class="arrow">→</span>
        </router-link>
      </div>
    </section>

    <template v-else>
      <section class="wall-bleed" aria-label="Photography">
        <GalleryWall :photos="photos" density="hero" :max-cols="5" />
      </section>
      <section class="strap-row container">
        <p class="mono-label strap">{{ content.home.strap }}</p>
        <router-link to="/work" class="btn">
          Wade in <span class="arrow">→</span>
        </router-link>
      </section>
    </template>
  </main>
</template>

<style scoped>
.home { padding-top: var(--header-h); }

.home-hero {
  position: relative;
  height: calc(100vh - var(--header-h));
  min-height: 540px;
}

/* lower-left gradient so the brand block reads over drifting photos
   in either colorway; the drift stays draggable everywhere else */
.hero-scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    22deg,
    color-mix(in srgb, var(--bg) 92%, transparent) 0%,
    color-mix(in srgb, var(--bg) 45%, transparent) 26%,
    transparent 52%
  );
}

.hero-brand {
  position: absolute;
  left: var(--gutter);
  bottom: clamp(2rem, 5vh, 3.6rem);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
  pointer-events: none;
}

.hero-title {
  font-size: clamp(3.2rem, 8.5vw, 7.5rem);
}

.hero-strap {
  max-width: 44ch;
  line-height: 2;
}

.hero-cta {
  pointer-events: auto;
  margin-top: 0.4rem;
}

/* fallback (touch / reduced motion): the flat wall */
.wall-bleed { padding: 0.3rem; }

.strap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  padding-top: 3.5rem;
  padding-bottom: 4.5rem;
}

.strap { max-width: 46ch; line-height: 2; }
</style>
