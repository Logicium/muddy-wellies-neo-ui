import { computed, ref } from 'vue'
import { photos, categoryLabels, type PhotoCategory } from '@/data/photos'

// Module-level so the active filter survives gallery mode switches
// and navigation within the session.
const active = ref<PhotoCategory | 'all'>('all')

const filtered = computed(() =>
  active.value === 'all' ? photos : photos.filter((p) => p.category === active.value),
)

const categories = computed(() => {
  const present = new Set(photos.map((p) => p.category))
  return (Object.keys(categoryLabels) as PhotoCategory[]).filter((c) => present.has(c))
})

function setCategory(c: PhotoCategory | 'all') {
  active.value = c
}

export function usePhotoCollection() {
  return { all: photos, filtered, categories, active, setCategory, categoryLabels }
}
