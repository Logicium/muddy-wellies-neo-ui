<script setup lang="ts">
import { usePhotoCollection } from '@/composables/usePhotoCollection'
import CategoryFilter from '@/components/CategoryFilter.vue'
import GalleryWall from '@/components/GalleryWall.vue'

const { filtered } = usePhotoCollection()
</script>

<template>
  <main class="portfolio">
    <div class="muck-head container">
      <h1 class="section-heading">The Work</h1>
      <CategoryFilter class="muck-filters" />
    </div>

    <div class="muck-stage">
      <GalleryWall :photos="filtered" />
    </div>
  </main>
</template>

<style scoped>
.portfolio {
  padding-top: var(--header-h);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.muck-head { padding-top: 2.2rem; }

.muck-filters { margin-top: 1.6rem; }

.muck-stage {
  margin-top: 1.4rem;
  flex: 1;
  min-height: 0;
  padding: 0 0.3rem 0.3rem;
}
</style>
