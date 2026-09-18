<script setup lang="ts">
/**
 * One photo, large. Arrow keys and swipe-sized buttons step; Escape and
 * the backdrop close. The pick and the print sizes ride along so nobody
 * has to leave the photo to decide about it.
 */
import type { GalleryImage, GalleryPriceItem } from './types'
import { money } from './theme'

defineProps<{
  image: GalleryImage
  index: number
  count: number
  picked: boolean
  prints: GalleryPriceItem[]
  currency: string
}>()

const emit = defineEmits<{ close: []; step: [d: number]; pick: []; print: [p: GalleryPriceItem] }>()
</script>

<template>
  <div class="ap-lb" role="dialog" aria-modal="true" :aria-label="image.filename" @click.self="emit('close')">
    <button type="button" class="ap-lb-close ap-mono" @click="emit('close')">Close</button>
    <button type="button" class="ap-lb-step prev" aria-label="Previous" @click="emit('step', -1)">‹</button>
    <figure class="ap-lb-figure">
      <img :src="image.previewUrl" :alt="image.filename" />
      <figcaption class="ap-lb-bar">
        <span class="ap-mono ap-lb-count">{{ index + 1 }} / {{ count }}</span>
        <button type="button" class="ap-lb-pick" :class="{ on: picked }" @click="emit('pick')">
          {{ picked ? 'Picked' : 'Pick this one' }}
        </button>
        <a v-if="image.downloadUrl" :href="image.downloadUrl" class="ap-mono ap-lb-link" download>Download</a>
        <span v-if="prints.length" class="ap-lb-prints">
          <button v-for="p in prints" :key="p.sku" type="button" class="ap-lb-print" @click="emit('print', p)">
            {{ p.sizeLabel || p.label }} <span class="ap-mono">{{ money(p.priceCents, currency) }}</span>
          </button>
        </span>
      </figcaption>
    </figure>
    <button type="button" class="ap-lb-step next" aria-label="Next" @click="emit('step', 1)">›</button>
  </div>
</template>

<style scoped>
.ap-lb {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  background: color-mix(in srgb, var(--ap-ink) 92%, transparent);
  color: var(--ap-paper);
  font-family: var(--ap-font);
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ap-lb-close {
  position: absolute;
  top: 1rem;
  right: 1.2rem;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.8;
}

.ap-lb-step {
  border: 0;
  background: none;
  color: inherit;
  font-size: 2.4rem;
  line-height: 1;
  padding: 1rem 0.8rem;
  cursor: pointer;
  opacity: 0.7;
}

.ap-lb-step:hover {
  opacity: 1;
}

.ap-lb-figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  max-height: 100vh;
  padding: 2.4rem 0 1.2rem;
}

.ap-lb-figure img {
  max-width: 100%;
  max-height: calc(100vh - 8rem);
  object-fit: contain;
  display: block;
}

.ap-lb-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.8rem 1.4rem;
}

.ap-lb-count {
  opacity: 0.7;
}

.ap-lb-pick {
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.5rem 0.9rem;
  border: 1px solid currentColor;
  border-radius: var(--ap-radius);
  background: none;
  color: inherit;
  cursor: pointer;
}

.ap-lb-pick.on {
  background: var(--ap-accent);
  border-color: var(--ap-accent);
}

.ap-lb-link {
  color: inherit;
  text-decoration: none;
  opacity: 0.8;
}

.ap-lb-prints {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.ap-lb-print {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: var(--ap-radius);
  background: none;
  color: inherit;
  cursor: pointer;
}

.ap-lb-print:hover {
  border-color: currentColor;
}

@media (max-width: 560px) {
  .ap-lb {
    grid-template-columns: 1fr;
  }
  .ap-lb-step {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  .ap-lb-step.prev {
    left: 0;
  }
  .ap-lb-step.next {
    right: 0;
  }
}
</style>
