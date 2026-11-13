<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useJournal, type JournalEntry } from '@/composables/useJournal'
import JournalBlocks from '@/components/JournalBlocks.vue'
import { useSeoData } from '@/seo'

const route = useRoute()
const { open } = useJournal()

const post = ref<JournalEntry | null>(null)
// title, description, canonical, share card and BlogPosting follow the loaded entry
useSeoData(post)
const resolved = ref(false)

watch(
  () => route.params.slug,
  async (slug) => {
    resolved.value = false
    post.value = typeof slug === 'string' ? await open(slug) : null
    resolved.value = true
  },
  { immediate: true },
)

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
      <figure v-if="post.cover" class="post-cover">
        <img :src="post.cover.src" :alt="post.cover.alt" decoding="async" />
      </figure>

      <header class="container post-head">
        <span class="mono-label">{{ dateFmt(post.date) }}</span>
        <h1 class="section-heading post-title">{{ post.title }}</h1>
        <p class="lede">{{ post.deck }}</p>
      </header>

      <section class="container post-body">
        <JournalBlocks v-if="post.blocks" :blocks="post.blocks" />
        <!-- the portal editor's html; Ashley is the only author -->
        <div v-else class="prose" v-html="post.body" />
      </section>

      <footer class="container post-foot">
        <router-link to="/journal" class="btn">← All entries</router-link>
      </footer>
    </template>

    <section v-else-if="resolved" class="section container">
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

/* portal-authored html, set in the same measure the block renderer uses */
.prose {
  max-width: 64ch;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  font-size: 1.08rem;
  line-height: 1.75;
}

.prose :deep(p) { margin: 0; }
.prose :deep(h2),
.prose :deep(h3) { margin: 1.2rem 0 0; line-height: 1.2; }
.prose :deep(figure) { margin: 0.6rem 0; }
.prose :deep(img) { width: 100%; height: auto; display: block; }
.prose :deep(figcaption) { margin-top: 0.6rem; color: var(--muted); font-size: 0.9rem; }
.prose :deep(a) { text-decoration: underline; }
.prose :deep(blockquote) {
  margin: 0;
  padding-left: 1.2rem;
  border-left: 2px solid var(--accent);
  color: var(--muted);
}

.post-foot {
  display: flex;
  justify-content: center;
  padding-bottom: clamp(4rem, 8vw, 7rem);
}

.lost-link { text-decoration: underline; }
</style>
