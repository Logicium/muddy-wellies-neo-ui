<script setup lang="ts">
/**
 * The customer portal: a business's customer, signed in, and everything
 * they have with that business in one place.
 *
 * Self-sufficient on purpose. Every colour is a custom property on the root
 * with a default, so a vendored copy inherits whatever the host site sets
 * for `--ap-*` and the hosted copy gets them from the business's brand.
 * Nothing here imports from outside the kit.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { createApotomePortal, type ApotomePortalOptions } from './portal'
import { applyPortalTheme, day, money } from './theme'
import type { PortalContext, PortalCustomer, PortalOverview, PortalSection } from './types'
import PortalSignIn from './PortalSignIn.vue'
import PortalDocuments from './PortalDocuments.vue'
import PortalProfile from './PortalProfile.vue'

const props = withDefaults(defineProps<ApotomePortalOptions & { initialTab?: string }>(), { portal: 'site' })

const portal = createApotomePortal({ siteKey: props.siteKey, apiUrl: props.apiUrl, portal: props.portal })

const root = ref<HTMLElement | null>(null)
const context = ref<PortalContext | null>(null)
const overview = ref<PortalOverview | null>(null)
const signedIn = ref(portal.signedIn())
const loading = ref(true)
const error = ref('')
const tab = ref<string>(props.initialTab ?? '')

const LABEL: Record<PortalSection | 'profile', string> = {
  galleries: 'Galleries',
  orders: 'Orders',
  appointments: 'Appointments',
  tickets: 'Tickets',
  invoices: 'Invoices',
  quotes: 'Quotes',
  agreements: 'Agreements',
  profile: 'Your details',
}

/* galleries lead when they exist, because on a photographer's site they are the point */
const ORDER: PortalSection[] = ['galleries', 'invoices', 'quotes', 'agreements', 'orders', 'appointments', 'tickets']

const tabs = computed<(PortalSection | 'profile')[]>(() => {
  const have = context.value?.sections ?? []
  return [...ORDER.filter((s) => have.includes(s)), 'profile']
})

async function loadOverview() {
  const r = await portal.overview()
  if (r.ok) {
    overview.value = r.data
    signedIn.value = true
  } else {
    // a dead token is dropped by the account module; show the door again
    overview.value = null
    signedIn.value = portal.signedIn()
    if (signedIn.value) error.value = r.error
  }
}

onMounted(async () => {
  if (!portal.configured) {
    loading.value = false
    error.value = 'The portal is not set up on this site yet.'
    return
  }
  const redeemed = await portal.redeemFromUrl()
  if (redeemed && !redeemed.ok) error.value = redeemed.error
  const c = await portal.context()
  if (c.ok) {
    context.value = c.data
    applyPortalTheme(root.value, c.data.business)
  } else error.value = c.error
  if (portal.signedIn()) await loadOverview()
  loading.value = false
  if (!tab.value || !tabs.value.includes(tab.value as PortalSection)) tab.value = tabs.value[0] ?? 'profile'
})

watch(tabs, (t) => {
  if (!t.includes(tab.value as PortalSection)) tab.value = t[0] ?? 'profile'
})

function signOut() {
  portal.signOut()
  signedIn.value = false
  overview.value = null
}

function onUpdated(me: PortalCustomer) {
  if (overview.value) overview.value = { ...overview.value, me }
}

const business = computed(() => context.value?.business ?? null)
</script>

<template>
  <div ref="root" class="apotome-portal">
    <header class="ap-head">
      <a v-if="business?.siteUrl" :href="business.siteUrl" class="ap-brand">
        <img v-if="business.logoUrl" :src="business.logoUrl" :alt="business.name" class="ap-logo" />
        <span v-else class="ap-brand-name">{{ business.name }}</span>
      </a>
      <span v-else-if="business" class="ap-brand"><span class="ap-brand-name">{{ business.name }}</span></span>
      <span class="ap-mono ap-kicker">Your account</span>
    </header>

    <p v-if="loading" class="ap-mono ap-quiet">Loading</p>

    <template v-else-if="!signedIn">
      <p v-if="error" class="ap-error" role="alert">{{ error }}</p>
      <PortalSignIn v-if="context" :portal="portal" :business-name="business?.name ?? 'your account'" />
    </template>

    <template v-else-if="overview">
      <nav class="ap-tabs" aria-label="Sections">
        <button
          v-for="t in tabs"
          :key="t"
          type="button"
          class="ap-tab"
          :class="{ on: tab === t }"
          :aria-pressed="tab === t"
          @click="tab = t"
        >
          {{ LABEL[t] }}
        </button>
        <button type="button" class="ap-tab ap-out" @click="signOut">Sign out</button>
      </nav>

      <p v-if="error" class="ap-error" role="alert">{{ error }}</p>

      <section v-if="tab === 'galleries'" class="ap-section">
        <slot name="galleries" :overview="overview" :portal="portal">
          <p class="ap-quiet">Your galleries will appear here once they are shared with you.</p>
        </slot>
      </section>

      <PortalDocuments v-else-if="tab === 'invoices'" kind="invoice" :docs="overview.invoices ?? []" />
      <PortalDocuments v-else-if="tab === 'quotes'" kind="quote" :docs="overview.quotes ?? []" />
      <PortalDocuments v-else-if="tab === 'agreements'" kind="agreement" :docs="overview.agreements ?? []" />

      <section v-else-if="tab === 'orders'" class="ap-section">
        <p v-if="!overview.orders?.length" class="ap-quiet">No orders yet.</p>
        <ul v-else class="ap-list">
          <li v-for="o in overview.orders" :key="o.id" class="ap-row">
            <span class="ap-col">
              <span class="ap-ink">Order #{{ o.id }} <span class="ap-mono ap-quiet">· {{ o.status }}</span></span>
              <span class="ap-quiet ap-small">{{ o.items.map((i) => `${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ''} × ${i.quantity}`).join(', ') }}</span>
              <a v-if="o.trackingUrl" :href="o.trackingUrl" target="_blank" rel="noopener" class="ap-mono ap-accent">Track ↗</a>
            </span>
            <span class="ap-mono ap-num">{{ money(o.totalCents, o.currency) }}</span>
            <span class="ap-mono ap-quiet">{{ day(o.createdAt) }}</span>
          </li>
        </ul>
      </section>

      <section v-else-if="tab === 'appointments'" class="ap-section">
        <p v-if="!overview.appointments?.length" class="ap-quiet">No appointments yet.</p>
        <ul v-else class="ap-list">
          <li v-for="a in overview.appointments" :key="a.id" class="ap-row">
            <span class="ap-col">
              <span class="ap-ink">{{ a.serviceName }}</span>
              <span class="ap-quiet ap-small">{{ a.when }}<template v-if="a.location"> · {{ a.location }}</template></span>
            </span>
            <span class="ap-mono ap-quiet">{{ a.status.replace('_', ' ') }}</span>
            <span class="ap-mono ap-num">{{ a.depositCents ? money(a.depositCents) : '' }}</span>
          </li>
        </ul>
      </section>

      <section v-else-if="tab === 'tickets'" class="ap-section">
        <p v-if="!overview.tickets?.length" class="ap-quiet">No tickets yet.</p>
        <ul v-else class="ap-list">
          <li v-for="t in overview.tickets" :key="t.id" class="ap-row ap-row-stack">
            <span class="ap-col">
              <span class="ap-ink">{{ t.eventTitle }}</span>
              <span class="ap-quiet ap-small">{{ new Date(t.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
            </span>
            <ul class="ap-tickets">
              <li v-for="k in t.tickets" :key="k.id" class="ap-ticket" :class="k.status">
                <img :src="k.qrUrl" :alt="`Ticket ${k.code}`" class="ap-qr" loading="lazy" />
                <span class="ap-mono ap-code">{{ k.code }}</span>
                <span class="ap-mono ap-quiet">{{ k.tierLabel }}<template v-if="k.status === 'used'"> · used</template></span>
              </li>
            </ul>
          </li>
        </ul>
      </section>

      <PortalProfile v-else :account="portal.account" :me="overview.me" @updated="onUpdated" />
    </template>

    <p v-else class="ap-error" role="alert">{{ error || 'Could not load your account.' }}</p>
  </div>
</template>

<style scoped>
.apotome-portal {
  --ap-paper: #f7f6f2;
  --ap-paper-dim: #eeece6;
  --ap-ink: #0a0a0a;
  --ap-ink-soft: #5c5c5c;
  --ap-accent: #0a0a0a;
  --ap-signal: #b3261e;
  --ap-line: 1px solid rgba(10, 10, 10, 0.16);
  --ap-font: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --ap-mono: ui-monospace, Menlo, Consolas, monospace;
  --ap-radius: 0;

  font-family: var(--ap-font);
  color: var(--ap-ink);
  background: var(--ap-paper);
  max-width: 62rem;
  margin: 0 auto;
  padding: 2rem 1.2rem 4rem;
  line-height: 1.55;
}

.ap-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1.2rem;
  margin-bottom: 1.6rem;
  border-bottom: var(--ap-line);
}

.ap-brand {
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.ap-logo {
  height: 2rem;
  width: auto;
}

.ap-brand-name {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ap-kicker,
.ap-quiet {
  color: var(--ap-ink-soft);
}

.ap-small {
  font-size: 0.92rem;
}

.ap-ink {
  color: var(--ap-ink);
}

.ap-accent {
  color: var(--ap-accent);
  text-decoration: none;
}

.ap-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1.4rem;
  margin: 0 0 1.6rem;
  border-bottom: var(--ap-line);
}

.ap-tab {
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.7rem 0;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  color: var(--ap-ink-soft);
  cursor: pointer;
}

.ap-tab.on {
  color: var(--ap-ink);
  border-bottom-color: var(--ap-accent);
}

.ap-out {
  margin-left: auto;
}

.ap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: var(--ap-line);
}

.ap-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 1.2rem;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: var(--ap-line);
}

.ap-row-stack {
  grid-template-columns: 1fr;
}

.ap-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ap-num {
  font-variant-numeric: tabular-nums;
  color: var(--ap-ink);
}

.ap-tickets {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.ap-ticket {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.ap-ticket.used {
  opacity: 0.5;
}

.ap-qr {
  width: 120px;
  height: 120px;
  border: var(--ap-line);
  background: #fff;
}

.ap-code {
  letter-spacing: 0.14em;
  color: var(--ap-ink);
}

.ap-error {
  margin: 0 0 1rem;
  color: var(--ap-signal);
}

@media (max-width: 560px) {
  .ap-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
