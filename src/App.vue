<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <router-view v-slot="{ Component }">
      <!-- explicit duration: timer-based, so navigation never hangs waiting on
           a transitionend that a hidden/non-compositing tab will not fire -->
      <transition name="page" mode="out-in" :duration="{ enter: 450, leave: 250 }">
        <component :is="Component" />
      </transition>
    </router-view>
    <SiteFooter />
    <ImageLightbox />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
