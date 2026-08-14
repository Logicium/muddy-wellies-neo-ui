<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { content } from '@/data/site'
import { photos } from '@/data/photos'
import JournalBlocks from '@/components/JournalBlocks.vue'

const route = useRoute()
const post = computed(() => content.journal.find((p) => p.slug === route.params.slug))
const cover = computed(() => photos.find((p) => p.id === post.value?.coverId))

const dateFmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
</script>

<template>
  <main class="post">
    <template v-if="post">
      <figure v-if="cover" class="post-cover">
        <img :src="cover.src" :alt="cover.alt" decoding="async" />
      </figure>

      <header class="container post-head">
        <span class="mono-label">{{ dateFmt(post.date) }}</span>
        <h1 class="section-heading post-title">{{ post.title }}</h1>
        <p class="lede">{{ post.deck }}</p>
      </header>

      <section class="container post-body">
        <JournalBlocks :blocks="post.blocks" />
      </section>

      <footer class="container post-foot">
        <router-link to="/journal" class="btn">← All entries</router-link>
      </footer>
    </template>

    <section v-else class="section container">
      <h1 class="section-heading">That trail does not exist.</h1>
      <p class="lede">
        <router-link to="/journal" class="lost-link">Back to the journal.</router-link>
      </p>
    </section>
  </main>
</template>

<style scoped>
.post { padding-top: var(--header-h); }

.post-cover {
  height: min(68vh, 640px);
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: clamp(2.5rem, 5vw, 4rem);
  padding-bottom: clamp(2rem, 4vw, 3rem);
  text-align: center;
  align-items: center;
}

.post-title { max-width: 20ch; }

.post-body { padding-bottom: clamp(3rem, 6vw, 5rem); }

.post-foot {
  display: flex;
  justify-content: center;
  padding-bottom: clamp(4rem, 8vw, 7rem);
}

.lost-link { text-decoration: underline; }
</style>
