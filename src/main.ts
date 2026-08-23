import './assets/main.css'

import { createApp, type Directive } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import { initApotomeAnalytics } from './kit/analytics'
import { applyDeep, initApotomeEditor, loadPublishedContent } from './kit/editor'
import { content } from './data/site'

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

/* ----------------------------------------------------------------------
 * Apotome Labs: analytics and the in-situ content editor.
 *
 * Both are opt-in on environment. With the variables unset this file does
 * nothing at all, so the site builds and runs standalone exactly as before.
 *
 * The published overlay is merged onto the content tree before the editor
 * starts, so the editor edits what visitors are actually seeing rather than
 * the defaults compiled into the bundle. Mounting happens first either way:
 * a slow or unreachable studio API must never delay the site rendering.
 * ---------------------------------------------------------------------- */
const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const siteKey = import.meta.env.VITE_APOTOME_SITE_KEY as string | undefined

if (apiUrl && siteKey) {
  initApotomeAnalytics({ siteKey, apiUrl, router })

  void loadPublishedContent({ siteKey, apiUrl }).then((overlay) => {
    if (overlay) applyDeep(content, overlay)
    initApotomeEditor({ siteKey, apiUrl, config: content })
  })
}
