<script setup lang="ts">
import type { JournalBlock } from '@/data/site'
import { photos } from '@/data/photos'
import { useLightbox } from '@/composables/useLightbox'

const props = defineProps<{ blocks: JournalBlock[] }>()
const { openLightbox } = useLightbox()

function photoById(id: string) {
  return photos.find((p) => p.id === id)
}

function open(id: string, e: Event) {
  const involved = props.blocks
    .flatMap((b) => b.photoIds ?? [])
    .map(photoById)
    .filter((p) => !!p)
  const index = involved.findIndex((p) => p.id === id)
  openLightbox(
    involved.map((p) => ({ src: p.src, thumb: p.thumb, title: p.alt })),
    Math.max(0, index),
    e.currentTarget as HTMLElement,
  )
}
</script>

<template>
  <div class="blocks">
    <template v-for="(block, i) in blocks" :key="i">
      <p v-if="block.type === 'text'" class="block-text" v-reveal>{{ block.text }}</p>

      <figure v-else-if="block.type === 'image'" class="block-image" v-reveal>
        <template v-for="id in block.photoIds" :key="id">
          <button v-if="photoById(id)" class="img-btn" @click="open(id, $event)">
            <img
              :src="photoById(id)!.src"
              :alt="photoById(id)!.alt"
              loading="lazy"
              decoding="async"
              :style="{ aspectRatio: String(photoById(id)!.ar) }"
            />
          </button>
        </template>
      </figure>

      <figure v-else-if="block.type === 'spread'" class="block-spread" v-reveal>
        <template v-for="id in block.photoIds" :key="id">
          <button v-if="photoById(id)" class="img-btn" @click="open(id, $event)">
            <img
              :src="photoById(id)!.src"
              :alt="photoById(id)!.alt"
              loading="lazy"
              decoding="async"
              :style="{ aspectRatio: String(photoById(id)!.ar) }"
            />
          </button>
        </template>
      </figure>
    </template>
  </div>
</template>

<style scoped>
.blocks {
  display: flex;
  flex-direction: column;
  gap: clamp(1.8rem, 4vw, 3rem);
}

.block-text {
  max-width: 62ch;
  margin: 0 auto;
  width: 100%;
  font-size: clamp(1.02rem, 1.3vw, 1.15rem);
  line-height: 1.85;
  color: var(--ink);
}

/* single images break out wider than the text measure */
.block-image {
  width: min(100%, 900px);
  margin: 0 auto;
}

/* spreads go full width, two-up */
.block-spread {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

@media (min-width: 760px) {
  .block-spread { grid-template-columns: 1fr 1fr; align-items: start; }
}

.img-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: var(--panel);
  cursor: zoom-in;
}

.img-btn img { width: 100%; height: auto; }
</style>
