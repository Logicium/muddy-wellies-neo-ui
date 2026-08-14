import { ref } from 'vue'

export type Theme = 'mud' | 'bone'

const STORAGE_KEY = 'mw-theme'

// MUD is the default: a dark theater where the photos glow.
// BONE is the stark gallery wall. One attribute on <html> flips every token.
const theme = ref<Theme>('mud')

function apply(t: Theme) {
  document.documentElement.dataset.theme = t
  // keep the browser chrome color in step on mobile
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = t === 'mud' ? '#12100d' : '#f6f4ef'
}

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'mud' || stored === 'bone') theme.value = stored
  apply(theme.value)
}

function setTheme(t: Theme) {
  theme.value = t
  localStorage.setItem(STORAGE_KEY, t)
  apply(t)
}

function toggleTheme() {
  setTheme(theme.value === 'mud' ? 'bone' : 'mud')
}

export function useTheme() {
  return { theme, setTheme, toggleTheme }
}
