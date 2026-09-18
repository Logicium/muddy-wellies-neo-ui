<script setup lang="ts">
/**
 * Who they are and where things go. The first consumer of the account
 * module's address CRUD, which was written some time ago and had never run.
 */
import { onMounted, ref } from 'vue'
import type { ApotomeAccount, ApotomeAddress, ApotomeAddressInput } from '../shop/account'
import type { PortalCustomer } from './types'

const props = defineProps<{ account: ApotomeAccount; me: PortalCustomer }>()
const emit = defineEmits<{ updated: [me: PortalCustomer] }>()

const name = ref(props.me.name ?? '')
const phone = ref(props.me.phone ?? '')
const consent = ref(props.me.marketingConsent)
const saving = ref(false)
const msg = ref('')

const addresses = ref<ApotomeAddress[]>([])
const adding = ref(false)
const draft = ref<ApotomeAddressInput>({ label: null, name: props.me.name ?? '', line1: '', line2: null, city: '', region: '', postal: '', country: 'US', phone: null })

async function loadAddresses() {
  const r = await props.account.addresses()
  if (r.ok) addresses.value = r.data
}
onMounted(loadAddresses)

async function save() {
  saving.value = true
  const r = await props.account.update({ name: name.value.trim() || undefined, phone: phone.value.trim() || undefined, marketingConsent: consent.value })
  saving.value = false
  msg.value = r.ok ? 'Saved.' : r.error
  if (r.ok) emit('updated', r.data)
  setTimeout(() => (msg.value = ''), 2500)
}

async function addAddress() {
  if (!draft.value.line1.trim() || !draft.value.city.trim()) return
  const r = await props.account.addAddress(draft.value)
  if (r.ok) {
    adding.value = false
    draft.value = { ...draft.value, line1: '', line2: null, city: '', region: '', postal: '' }
    await loadAddresses()
  } else msg.value = r.error
}

async function remove(a: ApotomeAddress) {
  await props.account.removeAddress(a.id)
  await loadAddresses()
}

async function makeDefault(a: ApotomeAddress) {
  await props.account.updateAddress(a.id, { isDefault: true })
  await loadAddresses()
}
</script>

<template>
  <section class="ap-profile">
    <form class="ap-form" @submit.prevent="save">
      <label class="ap-label"><span class="ap-mono">Name</span><input v-model="name" class="ap-input" autocomplete="name" /></label>
      <label class="ap-label"><span class="ap-mono">Phone</span><input v-model="phone" class="ap-input" autocomplete="tel" /></label>
      <label class="ap-check"><input v-model="consent" type="checkbox" /> <span>Send me news and offers</span></label>
      <div class="ap-acts">
        <button type="submit" class="ap-btn" :disabled="saving">{{ saving ? 'Saving' : 'Save' }}</button>
        <span v-if="msg" class="ap-mono ap-msg">{{ msg }}</span>
      </div>
      <p class="ap-mono ap-sub">Signed in as {{ me.email }}</p>
    </form>

    <h3 class="ap-h3">Addresses</h3>
    <ul v-if="addresses.length" class="ap-list">
      <li v-for="a in addresses" :key="a.id" class="ap-addr">
        <span class="ap-addr-text">
          <span>{{ a.name }}<span v-if="a.isDefault" class="ap-mono ap-default"> · default</span></span>
          <span class="ap-sub">{{ a.line1 }}<template v-if="a.line2">, {{ a.line2 }}</template>, {{ a.city }}, {{ a.region }} {{ a.postal }}</span>
        </span>
        <span class="ap-addr-acts">
          <button v-if="!a.isDefault" type="button" class="ap-link" @click="makeDefault(a)">Make default</button>
          <button type="button" class="ap-link quiet" @click="remove(a)">Remove</button>
        </span>
      </li>
    </ul>
    <p v-else class="ap-sub">No addresses saved.</p>

    <form v-if="adding" class="ap-form ap-addr-form" @submit.prevent="addAddress">
      <label class="ap-label"><span class="ap-mono">Name</span><input v-model="draft.name" class="ap-input" required /></label>
      <label class="ap-label"><span class="ap-mono">Street</span><input v-model="draft.line1" class="ap-input" required autocomplete="address-line1" /></label>
      <label class="ap-label"><span class="ap-mono">Apt, suite</span><input v-model="draft.line2" class="ap-input" autocomplete="address-line2" /></label>
      <div class="ap-grid3">
        <label class="ap-label"><span class="ap-mono">City</span><input v-model="draft.city" class="ap-input" required autocomplete="address-level2" /></label>
        <label class="ap-label"><span class="ap-mono">State</span><input v-model="draft.region" class="ap-input" required autocomplete="address-level1" /></label>
        <label class="ap-label"><span class="ap-mono">ZIP</span><input v-model="draft.postal" class="ap-input" required autocomplete="postal-code" /></label>
      </div>
      <div class="ap-acts">
        <button type="submit" class="ap-btn">Save address</button>
        <button type="button" class="ap-link quiet" @click="adding = false">Cancel</button>
      </div>
    </form>
    <button v-else type="button" class="ap-link" @click="adding = true">Add an address</button>
  </section>
</template>

<style scoped>
.ap-profile {
  max-width: 36rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.ap-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ap-label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ap-ink-soft);
}

.ap-input {
  font: inherit;
  padding: 0.6rem 0;
  border: 0;
  border-bottom: var(--ap-line);
  background: transparent;
  color: var(--ap-ink);
  border-radius: 0;
}

.ap-input:focus {
  outline: none;
  border-bottom-color: var(--ap-accent);
}

.ap-check {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  color: var(--ap-ink);
}

.ap-acts {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ap-btn {
  font: inherit;
  font-family: var(--ap-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.8rem 1.4rem;
  border: 1px solid var(--ap-accent);
  background: var(--ap-accent);
  color: var(--ap-paper);
  cursor: pointer;
  border-radius: var(--ap-radius);
}

.ap-btn:disabled {
  opacity: 0.6;
}

.ap-msg,
.ap-sub {
  color: var(--ap-ink-soft);
}

.ap-sub {
  font-size: 0.92rem;
}

.ap-h3 {
  margin: 0.6rem 0 0;
  font-family: var(--ap-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--ap-ink-soft);
}

.ap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: var(--ap-line);
}

.ap-addr {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: var(--ap-line);
}

.ap-addr-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: var(--ap-ink);
}

.ap-default {
  text-transform: none;
  letter-spacing: 0.04em;
}

.ap-addr-acts {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  white-space: nowrap;
}

.ap-link {
  font: inherit;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ap-ink);
  border-bottom: 1px solid var(--ap-ink);
  cursor: pointer;
  align-self: flex-start;
}

.ap-link.quiet {
  color: var(--ap-ink-soft);
  border-bottom-color: transparent;
}

.ap-grid3 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 560px) {
  .ap-grid3 {
    grid-template-columns: 1fr;
  }
}
</style>
