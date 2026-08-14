<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { content, type Addon } from '@/data/site'
import { useQuoteStore } from '@/stores/quote'

// Pick a package, stack add-ons, watch the number grow, send it over.
// The running estimate lands in the contact form as an itemized message.

const props = defineProps<{ selected?: string | null }>()

const router = useRouter()
const quote = useQuoteStore()

const tiers = content.pricing.tiers
const activeSlug = ref(tiers[0]?.slug ?? '')

// the rate index above can hand a tier down: "Build this one below"
watch(
  () => props.selected,
  (slug) => {
    if (slug) activeSlug.value = slug
  },
)

const activeTier = computed(() => tiers.find((t) => t.slug === activeSlug.value))

const picked = ref<Set<string>>(new Set())

// switching packages resets the add-on stack — different tiers, different add-ons
watch(activeSlug, () => {
  picked.value = new Set()
})

function toggle(a: Addon) {
  const next = new Set(picked.value)
  if (next.has(a.label)) next.delete(a.label)
  else next.add(a.label)
  picked.value = next
}

const chosenAddons = computed(
  () => activeTier.value?.addons.filter((a) => picked.value.has(a.label)) ?? [],
)

const total = computed(
  () =>
    (activeTier.value?.from ?? 0) +
    chosenAddons.value.reduce((sum, a) => sum + a.price, 0),
)

const dollars = (n: number) => `$${n.toLocaleString()}`

function sendOver() {
  const t = activeTier.value
  if (!t) return
  quote.set({
    tierSlug: t.slug,
    tierTitle: t.title,
    base: t.from,
    addons: chosenAddons.value.map((a) => ({ label: a.label, price: a.price })),
    total: total.value,
  })
  router.push('/contact')
}
</script>

<template>
  <section class="builder" aria-label="Build a quote">
    <div class="builder-head">
      <h2 class="section-heading">Stack it up</h2>
    </div>

    <div class="builder-grid">
      <div class="builder-left">
        <div class="tier-picks" role="radiogroup" aria-label="Session type">
          <button
            v-for="t in tiers"
            :key="t.slug"
            class="tier-pick"
            :class="{ on: t.slug === activeSlug }"
            role="radio"
            :aria-checked="t.slug === activeSlug"
            @click="activeSlug = t.slug"
          >
            <span class="tier-name display">{{ t.title }}</span>
            <span class="mono-label">from {{ dollars(t.from) }}</span>
          </button>
        </div>

        <div v-if="activeTier && activeTier.addons.length" class="addons">
          <span class="mono-label addons-label">Add-ons</span>
          <label
            v-for="a in activeTier.addons"
            :key="a.label"
            class="addon"
            :class="{ on: picked.has(a.label) }"
          >
            <input
              type="checkbox"
              class="addon-box"
              :checked="picked.has(a.label)"
              @change="toggle(a)"
            />
            <span class="addon-name">
              {{ a.label }}
              <em v-if="a.note" class="addon-note mono-label">{{ a.note }}</em>
            </span>
            <span class="addon-price mono-label">+{{ dollars(a.price) }}</span>
          </label>
        </div>
        <p v-else class="lede addons-none">
          Custom packages only for this one. Tell me what you're picturing and we price it together.
        </p>
      </div>

      <aside class="tally">
        <span class="mono-label">Estimated</span>
        <p class="tally-total display" aria-live="polite">{{ dollars(total) }}</p>
        <ul class="tally-lines">
          <li class="tally-line mono-label">
            <span>{{ activeTier?.title }}</span>
            <span>{{ dollars(activeTier?.from ?? 0) }}</span>
          </li>
          <li v-for="a in chosenAddons" :key="a.label" class="tally-line mono-label">
            <span>{{ a.label }}</span>
            <span>+{{ dollars(a.price) }}</span>
          </li>
        </ul>
        <button class="btn solid tally-send" @click="sendOver">
          Send this over <span class="arrow">→</span>
        </button>
        <p class="mono-label tally-fine">A starting point, not a contract. We fine tune together.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.builder { padding-top: clamp(3rem, 6vw, 5rem); }

.builder-head { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2.4rem; }

.builder-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .builder-grid { grid-template-columns: 1.5fr 1fr; gap: 4rem; align-items: start; }
}

.tier-picks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tier-pick {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--line);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.tier-pick:hover { border-color: var(--line-strong); }

.tier-pick.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.tier-name { font-size: clamp(1.05rem, 2vw, 1.5rem); }

.addons { margin-top: 2.2rem; display: flex; flex-direction: column; gap: 0.5rem; }

.addons-label { margin-bottom: 0.5rem; }

.addon {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: border-color var(--t-ui) ease, background var(--t-ui) ease;
}

.addon:hover { border-color: var(--line-strong); }

.addon.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.addon-box { accent-color: var(--accent); width: 15px; height: 15px; }

.addon-name { flex: 1; font-weight: 400; font-size: 0.95rem; }

.addon-note { font-style: normal; margin-left: 0.6rem; font-size: 0.55rem; color: var(--muted-2); }

.addon-price { color: var(--accent); }

.addons-none { margin-top: 2rem; }

.tally {
  position: sticky;
  top: calc(var(--header-h) + 1.5rem);
  border: 1px solid var(--line-strong);
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tally-total { font-size: clamp(2.6rem, 5vw, 4rem); color: var(--accent); }

.tally-lines {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}

.tally-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--muted);
}

.tally-send { justify-content: center; margin-top: 0.6rem; }

.tally-fine { color: var(--muted-2); font-size: 0.55rem; letter-spacing: 0.2em; }
</style>
