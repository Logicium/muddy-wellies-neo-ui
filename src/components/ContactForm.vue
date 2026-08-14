<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { content } from '@/data/site'
import { useQuoteStore } from '@/stores/quote'

// The call sheet: the inquiry form styled like a production document —
// ruled fields, mono stamps, a session-type row. Front-end only: validates,
// then hands off to the visitor's mail client with everything prefilled.
// A quote built on the rates page arrives as the message body.

const quote = useQuoteStore()

const name = ref('')
const email = ref('')
const sessionType = ref('')
const message = ref('')
const sent = ref(false)
const error = ref('')

onMounted(() => {
  if (quote.selection) {
    sessionType.value = quote.selection.tierTitle
    message.value = quote.toMessage()
    quote.clear()
  }
})

function submit() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    error.value = 'Name, email, and a few words are all it takes.'
    return
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    error.value = 'That email does not look quite right.'
    return
  }
  const subject = sessionType.value ? `${sessionType.value} inquiry` : 'Project inquiry'
  const body = `From: ${name.value} <${email.value}>\n\n${message.value}`
  window.location.href = `mailto:${content.email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`
  sent.value = true
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

    <p v-if="error" class="sheet-error mono-label" role="alert">{{ error }}</p>
    <p v-if="sent" class="sheet-sent mono-label" role="status">
      Your mail app should be open. If not, write {{ content.email }} directly.
    </p>

    <button class="btn solid sheet-send" type="submit">Send it <span class="arrow">→</span></button>
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
</style>
