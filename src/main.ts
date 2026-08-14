import './assets/main.css'

import { createApp, type Directive } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'

/**
 * v-reveal — fades/slides an element in the first time it enters the viewport.
 * Usage: v-reveal or v-reveal="200" (delay in ms).
 */
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
)

const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value) el.style.setProperty('--reveal-delay', `${binding.value}ms`)
    observer.observe(el)
  },
  unmounted(el) {
    observer.unobserve(el)
  },
}

// Apply the stored colorway before mount so the first paint is already themed.
initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('reveal', reveal)

app.mount('#app')
