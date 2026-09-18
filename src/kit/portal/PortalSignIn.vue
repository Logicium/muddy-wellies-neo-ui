<script setup lang="ts">
/**
 * Email in, link out. No password exists to forget.
 *
 * Says the same thing whether or not the address is known, because the
 * server does; a sign-in form must not be a way to check who is a customer.
 */
import { ref } from 'vue'
import type { ApotomePortal } from './portal'

const props = defineProps<{ portal: ApotomePortal; businessName: string }>()

const email = ref('')
const busy = ref(false)
const sent = ref(false)
const error = ref('')

async function submit() {
  const e = email.value.trim()
  if (!e || busy.value) return
  busy.value = true
  error.value = ''
  const r = await props.portal.requestLink(e)
  busy.value = false
  if (r.ok) sent.value = true
  else error.value = r.error
}
</script>

<template>
  <section class="ap-signin">
    <template v-if="sent">
      <h2 class="ap-h">Check your inbox.</h2>
      <p class="ap-p">If {{ email }} is known to {{ businessName }}, a sign-in link is on its way. It works once and expires in twenty minutes.</p>
      <button type="button" class="ap-link" @click="sent = false">Use a different address</button>
    </template>
    <form v-else class="ap-form" @submit.prevent="submit">
      <h2 class="ap-h">Sign in to {{ businessName }}.</h2>
      <p class="ap-p">Enter the email you gave us and we will send a link. No password to remember.</p>
      <label class="ap-label">
        <span class="ap-mono">Email</span>
        <input v-model="email" type="email" required autocomplete="email" class="ap-input" placeholder="you@example.com" />
      </label>
      <p v-if="error" class="ap-error" role="alert">{{ error }}</p>
      <button type="submit" class="ap-btn" :disabled="busy">{{ busy ? 'Sending' : 'Send me a link' }}</button>
    </form>
  </section>
</template>

<style scoped>
.ap-signin {
  max-width: 28rem;
}

.ap-h {
  margin: 0 0 0.6rem;
  font-family: var(--ap-font-display, var(--ap-font));
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--ap-ink);
}

.ap-p {
  margin: 0 0 1.4rem;
  line-height: 1.6;
  color: var(--ap-ink-soft);
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
  padding: 0.7rem 0;
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

.ap-btn {
  align-self: flex-start;
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
  cursor: wait;
}

.ap-link {
  font: inherit;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ap-ink);
  border-bottom: 1px solid var(--ap-ink);
  cursor: pointer;
}

.ap-error {
  margin: 0;
  color: var(--ap-signal, #b3261e);
}
</style>
