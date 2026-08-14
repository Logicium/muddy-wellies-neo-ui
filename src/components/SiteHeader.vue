<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { nav } from '@/data/site'
import { useTheme } from '@/composables/useTheme'

const scrolled = ref(false)
const menuOpen = ref(false)
const route = useRoute()
const { theme, toggleTheme } = useTheme()

const onScroll = () => {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <header class="header" :class="{ scrolled, open: menuOpen }">
    <div class="header-inner">
      <router-link to="/" class="wordmark" aria-label="Muddy Wellies Photography, home">
        <span class="wordmark-text">Muddy<em>Wellies</em></span>
      </router-link>

      <nav class="desk-nav" aria-label="Primary">
        <router-link v-for="l in nav" :key="l.to" :to="l.to" class="desk-link">
          <span class="link-label">{{ l.label }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <button
          class="theme-btn"
          :aria-label="`Switch to ${theme === 'mud' ? 'bone' : 'mud'} colorway`"
          :title="theme === 'mud' ? 'Bone colorway' : 'Mud colorway'"
          @click="toggleTheme"
        >
          <span class="theme-dot" aria-hidden="true" />
          <span class="theme-name">{{ theme }}</span>
        </button>

        <button
          class="menu-btn"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <span class="menu-label">{{ menuOpen ? 'Close' : 'Menu' }}</span>
          <span class="burger" aria-hidden="true"><span /><span /></span>
        </button>
      </div>
    </div>

    <!-- Teleported: backdrop-filter on .header would otherwise become the
         containing block for this fixed overlay and clamp it to header height. -->
    <Teleport to="body">
      <transition name="menu">
        <div v-if="menuOpen" class="mobile-menu">
          <nav aria-label="Mobile">
            <router-link v-for="l in nav" :key="l.to" :to="l.to" class="mobile-link">
              {{ l.label }}
            </router-link>
          </nav>
        </div>
      </transition>
    </Teleport>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  transition: background 0.4s ease, backdrop-filter 0.4s ease;
}

.header.scrolled {
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}

.header.open {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom-color: transparent;
  z-index: 120;
}

.header-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  height: var(--header-h);
  padding: 0 var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Theme ink, not blend tricks: the fixed header's own stacking context
   isolates mix-blend-mode from the page behind it, which left white text
   invisible on the bone colorway until the scrolled background appeared. */
.wordmark,
.desk-nav,
.header-right {
  color: var(--ink);
  transition: color 0.5s ease;
}

.wordmark { display: flex; align-items: center; z-index: 2; }

.wordmark-text {
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1;
  letter-spacing: 0.04em;
  font-size: 0.9rem;
}

.wordmark-text em {
  font-style: normal;
  font-weight: 300;
  opacity: 0.55;
  margin-left: 0.4em;
}

.desk-nav {
  display: none;
  align-items: center;
  gap: 1.9rem;
}

@media (min-width: 980px) {
  .desk-nav { display: flex; }
  .menu-btn { display: none !important; }
}

.desk-link {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.link-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 400;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.85;
  transition: opacity var(--t-ui) ease;
}

.desk-link:hover .link-label,
.desk-link.router-link-active .link-label { opacity: 1; }

.desk-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -0.55rem;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 3px;
  background: currentColor;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  z-index: 2;
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem 0;
  color: inherit;
}

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  background: transparent;
  transition: background var(--t-ui) ease;
}

/* dot fills in bone mode: a tiny sun/moon without an icon library */
:root[data-theme='bone'] .theme-dot { background: currentColor; }

.theme-name {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.7;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
  color: inherit;
}

.menu-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.burger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 24px;
}

.burger span {
  display: block;
  height: 2px;
  background: currentColor;
  transition: transform var(--t-ui) ease;
}

.open .burger span:nth-child(1) { transform: translateY(3.5px) rotate(45deg); }
.open .burger span:nth-child(2) { transform: translateY(-3.5px) rotate(-45deg); }

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 115;
  background: color-mix(in srgb, var(--bg) 30%, transparent);
  backdrop-filter: blur(30px) saturate(1.1);
  -webkit-backdrop-filter: blur(30px) saturate(1.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--header-h) var(--gutter) 2rem;
}

.mobile-menu nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
}

.mobile-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 6.5vw, 2.4rem);
  text-transform: uppercase;
  line-height: 1;
  color: var(--ink);
  transition: opacity 0.55s var(--ease-out), transform 0.55s var(--ease-out), color var(--t-ui) ease;
}

.mobile-link:hover,
.mobile-link.router-link-exact-active { color: var(--accent); }

.menu-enter-active {
  transition:
    background 0.45s ease,
    backdrop-filter 0.45s ease,
    -webkit-backdrop-filter 0.45s ease;
}

.menu-leave-active {
  transition:
    background 0.6s ease 0.1s,
    backdrop-filter 0.6s ease 0.1s,
    -webkit-backdrop-filter 0.6s ease 0.1s;
}

.menu-enter-from,
.menu-leave-to {
  background: transparent;
  backdrop-filter: blur(0px) saturate(1);
  -webkit-backdrop-filter: blur(0px) saturate(1);
}

.menu-enter-from .mobile-link { opacity: 0; transform: translateY(24px); }

.menu-enter-active .mobile-link:nth-child(1) { transition-delay: 0.08s; }
.menu-enter-active .mobile-link:nth-child(2) { transition-delay: 0.14s; }
.menu-enter-active .mobile-link:nth-child(3) { transition-delay: 0.2s; }
.menu-enter-active .mobile-link:nth-child(4) { transition-delay: 0.26s; }
.menu-enter-active .mobile-link:nth-child(5) { transition-delay: 0.32s; }

.menu-leave-active .mobile-link {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.3s ease, transform 0.3s var(--ease-out);
}

.menu-leave-active .mobile-link:nth-child(1) { transition-delay: 0s; }
.menu-leave-active .mobile-link:nth-child(2) { transition-delay: 0.05s; }
.menu-leave-active .mobile-link:nth-child(3) { transition-delay: 0.1s; }
.menu-leave-active .mobile-link:nth-child(4) { transition-delay: 0.15s; }
.menu-leave-active .mobile-link:nth-child(5) { transition-delay: 0.2s; }
</style>
