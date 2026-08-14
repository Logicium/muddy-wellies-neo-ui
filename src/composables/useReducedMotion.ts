import { ref, onMounted, onUnmounted } from 'vue'

/** Reactive wrapper around prefers-reduced-motion. */
export function useReducedMotion() {
  const reduced = ref(false)
  let mq: MediaQueryList | null = null

  const update = () => {
    if (mq) reduced.value = mq.matches
  }

  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mq.addEventListener('change', update)
  })

  onUnmounted(() => mq?.removeEventListener('change', update))

  return reduced
}
