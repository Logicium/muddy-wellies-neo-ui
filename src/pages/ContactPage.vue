<script setup lang="ts">
import { computed } from 'vue'
import { content } from '@/data/site'
import { photos } from '@/data/photos'
import { useLightbox } from '@/composables/useLightbox'
import { categoryLabels } from '@/data/photos'
import ContactForm from '@/components/ContactForm.vue'

// Two things matter here: the email and the form. Everything else is quiet —
// no framed card, no ruled fact table, no clock. The contact strip along the
// bottom stays exactly as it was.
const { openLightbox } = useLightbox()

const strip = computed(() =>
  photos.filter((p) => p.category === 'wander' || p.category === 'wild').slice(0, 7),
)

function openStrip(index: number, e: Event) {
  openLightbox(
    strip.value.map((p) => ({
      src: p.src,
      thumb: p.thumb,
      title: p.alt,
      label: categoryLabels[p.category],
    })),
    index,
    e.currentTarget as HTMLElement,
  )
}
</script>

<template>
  <main class="contact">
    <section class="section container contact-top">
      <div class="contact-left">
        <h1 class="display contact-howdy">{{ content.contact.heading }}</h1>
        <p class="lede">{{ content.contact.line }}</p>

        <a :href="`mailto:${content.email}`" class="big-mail display">
          {{ content.email }}
        </a>

        <div class="contact-meta">
          <p class="mono-label">
            {{ content.location }}
            <span class="meta-dot" aria-hidden="true">·</span>
            {{ content.contact.response }}
          </p>
          <a :href="content.instagram" target="_blank" rel="noopener" class="mono-label meta-link">
            @muddywelliesphotography
          </a>
        </div>
      </div>

      <ContactForm class="contact-sheet" />
    </section>

    <section class="strip-row" aria-label="From recent shoots">
      <button
        v-for="(p, i) in strip"
        :key="p.id"
        class="strip-cell"
        :aria-label="p.alt"
        @click="openStrip(i, $event)"
      >
        <img :src="p.thumb" :alt="p.alt" loading="lazy" decoding="async" />
      </button>
    </section>
  </main>
</template>

<style scoped>
.contact {
  padding-top: var(--header-h);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.contact-top {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
  flex: 1;
}

@media (min-width: 980px) {
  .contact-top {
    grid-template-columns: 1.1fr 1fr;
    gap: clamp(3rem, 8vw, 7rem);
    align-items: start;
  }
}

.contact-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.2rem;
}

.contact-howdy { font-size: clamp(3rem, 8vw, 7rem); }

/* the email is the loudest link on the site */
.big-mail {
  margin-top: 1.6rem;
  font-size: clamp(1.15rem, 2.4vw, 2.1rem);
  text-transform: none;
  letter-spacing: 0;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.2rem;
  transition: color var(--t-ui) ease;
  overflow-wrap: anywhere;
}

.big-mail:hover { color: var(--accent); }

/* two quiet lines instead of a ruled table — separators live inside a line
   so a wrap can never leave one dangling at the end */
.contact-meta {
  margin-top: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  color: var(--muted-2);
}

.meta-dot { padding: 0 0.45rem; }

.meta-link { color: var(--muted); transition: color var(--t-ui) ease; }
.meta-link:hover { color: var(--accent); }

/* full-bleed contact strip: the studio's contact sheet */
.strip-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 2px;
}

@media (max-width: 760px) {
  .strip-row { grid-template-columns: repeat(4, 1fr); }
  .strip-row .strip-cell:nth-child(n + 5) { display: none; }
}

.strip-cell {
  display: block;
  padding: 0;
  border: none;
  background: var(--panel);
  cursor: zoom-in;
  overflow: hidden;
  aspect-ratio: 5 / 4;
}

.strip-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
  transition: opacity var(--t-ui) ease, transform 0.9s var(--ease-out);
}

.strip-cell:hover img { opacity: 1; transform: scale(1.05); }

@media (prefers-reduced-motion: reduce) {
  .strip-cell img { transition: none; }
  .strip-cell:hover img { transform: none; }
}
</style>
