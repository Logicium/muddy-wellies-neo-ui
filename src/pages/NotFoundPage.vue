<script setup lang="ts">
/**
 * The 404. A real page with a real status in the prerendered 404.html, never
 * a redirect home: a broken link should show up in Search Console, and a
 * visitor should land somewhere useful.
 */
import { nav } from '@/data/site'
</script>

<template>
  <main class="not-found">
    <section class="section container nf-body">
      <span class="mono-label">(404)</span>
      <h1 class="section-heading">That trail does not exist.</h1>
      <p class="lede">That page is not on muddywelliesphotography.com. It may have moved, or the link may have a typo.</p>
      <nav aria-label="Main pages" class="nf-links">
        <ul>
          <li v-for="l in nav" :key="l.to">
            <router-link :to="l.to">{{ l.label }}</router-link>
          </li>
        </ul>
      </nav>
      <router-link to="/" class="btn">Back to the start</router-link>
    </section>
  </main>
</template>

<style scoped>
.not-found { padding-top: var(--header-h); min-height: 70vh; }
.nf-body {
  display: grid;
  gap: 1.5rem;
  justify-items: start;
  max-width: 60ch;
}
.nf-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
}
.nf-links a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
