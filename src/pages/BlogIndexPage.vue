<script setup lang="ts">
import { content } from '@/data/site'
import { photos } from '@/data/photos'

function cover(id: string) {
  return photos.find((p) => p.id === id)
}

const dateFmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
</script>

<template>
  <main class="journal">
    <section class="section container journal-head">
      <h1 class="section-heading">Journal</h1>
    </section>

    <section class="container cards">
      <router-link
        v-for="p in content.journal"
        :key="p.slug"
        :to="`/journal/${p.slug}`"
        class="card"
        v-reveal
      >
        <div class="card-media img-frame" v-if="cover(p.coverId)">
          <img
            :src="cover(p.coverId)!.src"
            :alt="cover(p.coverId)!.alt"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="card-copy">
          <span class="mono-label">{{ dateFmt(p.date) }}</span>
          <h2 class="card-title display">{{ p.title }}</h2>
          <p class="lede">{{ p.deck }}</p>
          <span class="mono-label card-more">Read it <span aria-hidden="true">→</span></span>
        </div>
      </router-link>
    </section>
  </main>
</template>

<style scoped>
.journal { padding-top: var(--header-h); min-height: 80vh; }

.journal-head {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-bottom: 1.5rem;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-bottom: clamp(4rem, 8vw, 7rem);
}

.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.6rem;
  border-top: 1px solid var(--line);
  padding-top: 2.2rem;
}

@media (min-width: 860px) {
  .card { grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: center; }
}

.card-media { aspect-ratio: 3 / 2; }

.card-media img { transition: transform 1.1s var(--ease-out); }
.card:hover .card-media img { transform: scale(1.03); }

.card-copy { display: flex; flex-direction: column; gap: 0.9rem; }

.card-title { font-size: clamp(1.5rem, 3vw, 2.5rem); }

.card-more { color: var(--accent); }
</style>
