<script lang="ts">
/** what the cart holds; client-side state for one sitting, never a row */
export interface CartLine {
  sku: string
  label: string
  imageId?: number
  previewUrl?: string
  filename?: string
  quantity: number
  unitCents: number
}
</script>

<script setup lang="ts">
/**
 * Prints and extras, then to Stripe.
 *
 * Every price shown here is the service's; the checkout sends skus and
 * quantities and the service re-prices the lot, so a stale list shows a
 * stale price and charges the right one.
 */
import { computed, ref } from 'vue'
import type { ApotomeGalleries } from '../galleries'
import { money } from './theme'

const props = defineProps<{
  galleries: ApotomeGalleries
  galleryId: number
  lines: CartLine[]
  currency: string
  /** picks past the included count, priced at checkout */
  extraCount: number
  extraCents: number | null
}>()
const emit = defineEmits<{ close: []; update: [lines: CartLine[]] }>()

const address = ref({ name: '', line1: '', line2: '', city: '', state: '', postal: '', country: 'US' })
const sending = ref(false)
const error = ref('')

const needsShipping = computed(() => props.lines.some((l) => !!l.imageId || l.sku !== 'extra-image'))
const subtotal = computed(
  () => props.lines.reduce((n, l) => n + l.unitCents * l.quantity, 0) + (props.extraCents ? props.extraCount * props.extraCents : 0),
)

function setQty(i: number, q: number) {
  const next = props.lines.map((l, idx) => (idx === i ? { ...l, quantity: q } : l)).filter((l) => l.quantity > 0)
  emit('update', next)
}

async function pay() {
  if (needsShipping.value && (!address.value.line1.trim() || !address.value.city.trim() || !address.value.postal.trim())) {
    error.value = 'Prints need an address to go to.'
    return
  }
  sending.value = true
  error.value = ''
  const r = await props.galleries.checkout(props.galleryId, {
    lines: props.lines.map((l) => ({ sku: l.sku, imageId: l.imageId, quantity: l.quantity })),
    shippingAddress: needsShipping.value ? { ...address.value } : undefined,
  })
  sending.value = false
  if (!r.ok) {
    error.value = r.error
    return
  }
  window.location.assign(r.data.url)
}
</script>

<template>
  <div class="ap-cart-scrim" @click.self="emit('close')">
    <aside class="ap-cart" role="dialog" aria-modal="true" aria-label="Prints">
      <header class="ap-cart-head">
        <span class="ap-mono">Prints</span>
        <button type="button" class="ap-mono ap-cart-close" @click="emit('close')">Close</button>
      </header>

      <p v-if="!lines.length && !extraCount" class="ap-quiet">
        Nothing here yet. Open a photo and choose a size, or pick a package above the gallery.
      </p>

      <ul v-else class="ap-cart-lines">
        <li v-for="(l, i) in lines" :key="`${l.sku}:${l.imageId ?? ''}`" class="ap-cart-line">
          <img v-if="l.previewUrl" :src="l.previewUrl" :alt="l.filename ?? ''" class="ap-cart-thumb" />
          <span v-else class="ap-cart-thumb ap-cart-thumb-blank" aria-hidden="true"></span>
          <span class="ap-cart-text">
            <span>{{ l.label }}</span>
            <span class="ap-mono ap-quiet">{{ money(l.unitCents, currency) }} each</span>
          </span>
          <span class="ap-cart-qty">
            <button type="button" aria-label="Fewer" @click="setQty(i, l.quantity - 1)">−</button>
            <span class="ap-mono">{{ l.quantity }}</span>
            <button type="button" aria-label="More" @click="setQty(i, l.quantity + 1)">+</button>
          </span>
        </li>
        <li v-if="extraCount && extraCents" class="ap-cart-line">
          <span class="ap-cart-thumb ap-cart-thumb-blank" aria-hidden="true"></span>
          <span class="ap-cart-text">
            <span>{{ extraCount }} extra {{ extraCount === 1 ? 'photo' : 'photos' }} past your included picks</span>
            <span class="ap-mono ap-quiet">{{ money(extraCents, currency) }} each</span>
          </span>
          <span class="ap-mono">{{ money(extraCount * extraCents, currency) }}</span>
        </li>
      </ul>

      <template v-if="lines.length || extraCount">
        <form v-if="needsShipping" class="ap-cart-form" @submit.prevent="pay">
          <p class="ap-mono ap-quiet">Ship to</p>
          <input v-model="address.name" placeholder="Name" autocomplete="name" />
          <input v-model="address.line1" placeholder="Street address" autocomplete="address-line1" required />
          <input v-model="address.line2" placeholder="Apartment, unit" autocomplete="address-line2" />
          <div class="ap-cart-row">
            <input v-model="address.city" placeholder="City" autocomplete="address-level2" required />
            <input v-model="address.state" placeholder="State" autocomplete="address-level1" />
            <input v-model="address.postal" placeholder="ZIP" autocomplete="postal-code" required />
          </div>
        </form>

        <p v-if="error" class="ap-error" role="alert">{{ error }}</p>

        <footer class="ap-cart-foot">
          <span class="ap-cart-total">
            <span class="ap-mono ap-quiet">Subtotal</span>
            <span class="ap-cart-sum">{{ money(subtotal, currency) }}</span>
            <span class="ap-quiet ap-small">Shipping and tax are added at checkout.</span>
          </span>
          <button type="button" class="ap-cart-pay" :disabled="sending" @click="pay">
            {{ sending ? 'One moment' : 'Pay by card' }}
          </button>
        </footer>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.ap-cart-scrim {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: color-mix(in srgb, var(--ap-ink) 40%, transparent);
  display: flex;
  justify-content: flex-end;
  font-family: var(--ap-font);
  color: var(--ap-ink);
}

.ap-cart {
  width: min(100%, 26rem);
  height: 100%;
  overflow-y: auto;
  background: var(--ap-paper);
  padding: 1.4rem 1.4rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ap-quiet {
  color: var(--ap-ink-soft);
}

.ap-small {
  font-size: 0.85rem;
  letter-spacing: 0;
  text-transform: none;
}

.ap-error {
  margin: 0;
  color: var(--ap-signal);
}

.ap-cart-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 0.8rem;
  border-bottom: var(--ap-line);
}

.ap-cart-close {
  border: 0;
  background: none;
  color: var(--ap-ink-soft);
  cursor: pointer;
}

.ap-cart-lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.ap-cart-line {
  display: grid;
  grid-template-columns: 3.2rem minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.7rem 0;
  border-bottom: var(--ap-line);
}

.ap-cart-thumb {
  width: 3.2rem;
  height: 3.2rem;
  object-fit: cover;
  border-radius: var(--ap-radius);
  background: var(--ap-paper-dim);
  display: block;
}

.ap-cart-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ap-cart-qty {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.ap-cart-qty button {
  width: 1.6rem;
  height: 1.6rem;
  border: var(--ap-line);
  border-radius: var(--ap-radius);
  background: none;
  color: inherit;
  cursor: pointer;
  line-height: 1;
}

.ap-cart-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ap-cart-form input {
  font: inherit;
  padding: 0.6rem 0.7rem;
  border: var(--ap-line);
  border-radius: var(--ap-radius);
  background: var(--ap-paper);
  color: var(--ap-ink);
  width: 100%;
  box-sizing: border-box;
}

.ap-cart-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 0.5rem;
}

.ap-cart-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding-top: 1rem;
  border-top: var(--ap-line);
}

.ap-cart-total {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ap-cart-sum {
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}

.ap-cart-pay {
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.85rem 1rem;
  border: 0;
  border-radius: var(--ap-radius);
  background: var(--ap-accent);
  color: var(--ap-paper);
  cursor: pointer;
}

.ap-cart-pay:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
