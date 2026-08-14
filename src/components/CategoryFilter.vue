<script setup lang="ts">
import { usePhotoCollection } from '@/composables/usePhotoCollection'

const { categories, active, setCategory, categoryLabels, filtered } = usePhotoCollection()
</script>

<template>
  <div class="filters" role="group" aria-label="Filter photos">
    <button
      class="chip mono-label"
      :class="{ on: active === 'all' }"
      @click="setCategory('all')"
    >
      Everything
    </button>
    <button
      v-for="c in categories"
      :key="c"
      class="chip mono-label"
      :class="{ on: active === c }"
      @click="setCategory(c)"
    >
      {{ categoryLabels[c] }}
    </button>
    <span class="count mono-label" aria-live="polite">{{ filtered.length }} frames</span>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip {
  padding: 0.5rem 1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.chip:hover { border-color: var(--line-strong); color: var(--ink); }

.chip.on {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--bg);
}

.count {
  margin-left: auto;
  color: var(--muted-2);
}
</style>
