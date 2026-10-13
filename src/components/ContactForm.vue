<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { content } from '@/data/site'
import { useQuoteStore } from '@/stores/quote'
import { createApotomeForm } from '@/kit/forms'

// The call sheet: the inquiry form styled like a production document —
// ruled fields, mono stamps, a session-type row. Validates, then sends
// through the Apotome Labs forms add-on: the inquiry lands in Ashley's
// portal inbox and her email, reply-to set to the person asking. A quote
// built on the rates page arrives as the message body.

const quote = useQuoteStore()
const contact = createApotomeForm({ form: 'contact' })

const name = ref('')
const email = ref('')
const sessionType = ref('')
const message = ref('')
/* the decoy field; a real visitor never sees it, so it must stay empty */
const honeypot = ref('')
const sent = ref(false)
const sending = ref(false)
const error = ref('')

onMounted(() => {
  if (quote.selection) {
    sessionType.value = quote.selection.tierTitle
    message.value = quote.toMessage()
    quote.clear()
  }
})

async function submit() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    error.value = 'Name, email, and a few words are all it takes.'
    return
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    error.value = 'That email does not look quite right.'
    return
  }
  if (sending.value) return
  sending.value = true
  const result = await contact.submit({
    name: name.value,
    email: email.value,
    sessionType: sessionType.value,
    message: message.value,
    [contact.honeypotField]: honeypot.value,
  })
  sending.value = false
  if (result.ok) {
    sent.value = true
    name.value = ''
    email.value = ''
    sessionType.value = ''
    message.value = ''
  } else {
    error.value = result.error
  }
}
</script>

<template>
  <form class="sheet" novalidate @submit.prevent="submit">
    <div class="sheet-row two">
      <label class="sheet-field">
        <span class="mono-label">Name</span>
        <input v-model="name" type="text" name="name" autocomplete="name" required />
      </label>
      <label class="sheet-field">
        <span class="mono-label">Email</span>
        <input v-model="email" type="email" name="email" autocomplete="email" required />
      </label>
    </div>

    <fieldset class="sheet-types">
      <legend class="mono-label">Session</legend>
      <div class="type-chips">
        <button
          v-for="t in content.contact.sessionTypes"
          :key="t"
          type="button"
          class="type-chip mono-label"
          :class="{ on: sessionType === t }"
          @click="sessionType = sessionType === t ? '' : t"
        >
          {{ t }}
        </button>
      </div>
    </fieldset>

    <label class="sheet-field">
      <span class="mono-label">The idea</span>
      <textarea
        v-model="message"
        name="message"
        rows="7"
        required
        placeholder="Location, people, weather you're hoping for, weather you'll settle for"
      />
    </label>

    <!--
      Honeypot. Positioned off-screen rather than type="hidden": a hidden
      input is trivially skipped by a bot, a text input moved out of the
      viewport is not. Kept out of the tab order and the a11y tree.
    -->
    <div class="hp" aria-hidden="true">
      <label :for="contact.honeypotField">Do not fill this in</label>
      <input :id="contact.honeypotField" v-model="honeypot" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <p v-if="error" class="sheet-error mono-label" role="alert">{{ error }}</p>
    <p v-if="sent" class="sheet-sent mono-label" role="status">
      Sent. Ashley replies within 48 hours; in a hurry, write {{ content.email }} directly.
    </p>

    <button class="btn solid sheet-send" type="submit" :disabled="sending">
      {{ sending ? 'Sending' : 'Send it' }} <span class="arrow">→</span>
    </button>
  </form>
</template>

<style scoped>
/* no card, no frame: the fields sit on the page and the ruled underlines
   are the only structure */
.sheet {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.sheet-row.two {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.6rem;
}

@media (min-width: 620px) {
  .sheet-row.two { grid-template-columns: 1fr 1fr; }
}

.sheet-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

/* ruled lines, not boxes: a document, not a web form */
input,
textarea {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--line-strong);
  border-radius: 0;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  padding: 0.5rem 0.1rem;
  transition: border-color var(--t-ui) ease;
  resize: vertical;
}

textarea { line-height: 1.7; }

input:focus,
textarea:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

::placeholder { color: var(--muted-2); font-weight: 300; }

.sheet-types {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-chip {
  padding: 0.5rem 1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.type-chip:hover { border-color: var(--line-strong); color: var(--ink); }

.type-chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.sheet-error { color: #c8563a; }
.sheet-sent { color: var(--accent); }

.sheet-send { align-self: flex-start; }

/* honeypot: out of sight and out of the tab order, but a real input */
.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
