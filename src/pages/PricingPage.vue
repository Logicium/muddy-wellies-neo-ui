<script setup lang="ts">
import { ref } from 'vue'
import { content } from '@/data/site'
import PricingIndex from '@/components/PricingIndex.vue'
import QuoteBuilder from '@/components/QuoteBuilder.vue'

const buildTier = ref<string | null>(null)

function onBuild(slug: string) {
  buildTier.value = slug
  document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <main class="pricing">
    <!-- masthead: title, standfirst, then the rule that opens the feature -->
    <section class="section container pricing-head">
      <h1 class="section-heading">Rates</h1>
      <p class="pricing-standfirst">{{ content.pricing.intro }}</p>
    </section>

    <section class="container">
      <PricingIndex @build="onBuild" />
    </section>

    <section id="builder" class="container builder-wrap">
      <QuoteBuilder :selected="buildTier" />
    </section>
  </main>
</template>

<style scoped>
.pricing { padding-top: var(--header-h); }

.pricing-head {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding-bottom: clamp(2.5rem, 6vw, 4.5rem);
}

/* standfirst: the paragraph a feature opens on, set larger than body */
.pricing-standfirst {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  line-height: 1.45;
  max-width: 42ch;
  color: var(--muted);
}

.builder-wrap {
  padding-bottom: clamp(4rem, 8vw, 7rem);
  scroll-margin-top: calc(var(--header-h) + 1rem);
}
</style>
