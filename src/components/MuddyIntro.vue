<script setup lang="ts">
import { onMounted, ref } from 'vue'

// Once-per-session cinematic opener: a black frame, the name in a film-leader
// flicker, then it lifts away and the wall is already there underneath.
// Skipped entirely for return visits and reduced-motion users.

const KEY = 'mw-intro-seen'
const show = ref(false)
const leaving = ref(false)

const emit = defineEmits<{ done: [] }>()

function finish() {
  if (leaving.value) return
  leaving.value = true
  setTimeout(() => {
    show.value = false
    emit('done')
  }, 900)
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (sessionStorage.getItem(KEY) || reduced) {
    emit('done')
    return
  }
  sessionStorage.setItem(KEY, '1')
  show.value = true
  setTimeout(finish, 2600)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="intro" :class="{ leaving }" @click="finish">
      <div class="intro-frame">
        <span class="intro-count mono-label" aria-hidden="true">EST. SCOTLAND · SHOT IN COLORADO</span>
        <h1 class="intro-name display">Muddy<br />Wellies</h1>
        <span class="intro-sub mono-label">documentary photography</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: #0c0b09;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.85s ease, visibility 0.85s;
}

.intro.leaving { opacity: 0; visibility: hidden; }

.intro-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.3rem;
  text-align: center;
  color: #e9e2d4;
}

.intro-count {
  color: rgba(233, 226, 212, 0.5);
  animation: flicker 2.4s steps(12) both;
}

.intro-name {
  font-size: clamp(3.4rem, 12vw, 9.5rem);
  color: #e9e2d4;
  animation: flicker 1.6s steps(8) both;
}

.intro-sub {
  color: #c68f3f;
  animation: rise 0.9s 0.9s var(--ease-out) both;
}

@keyframes flicker {
  0% { opacity: 0; }
  8% { opacity: 0.9; }
  14% { opacity: 0.2; }
  22% { opacity: 1; }
  30% { opacity: 0.4; }
  42% { opacity: 1; }
  56% { opacity: 0.85; }
  70% { opacity: 1; }
  100% { opacity: 1; }
}

@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
