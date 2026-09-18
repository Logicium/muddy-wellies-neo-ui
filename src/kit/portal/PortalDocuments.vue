<script setup lang="ts">
/**
 * Quotes, invoices and agreements, one list each, same row.
 *
 * Every row opens the page that already exists for the document, so paying
 * an invoice or signing an agreement happens where it always has; the
 * portal is the door, not a second copy of the room.
 */
import type { PortalDoc } from './types'
import { day, money } from './theme'

const props = defineProps<{
  kind: 'quote' | 'invoice' | 'agreement'
  docs: PortalDoc[]
}>()

const NOUN = { quote: 'quotes', invoice: 'invoices', agreement: 'agreements' } as const

function verb(d: PortalDoc): string {
  if (d.kind === 'invoice') return d.status === 'paid' ? 'Paid' : d.status === 'void' ? 'Void' : 'View and pay'
  if (d.kind === 'quote') return d.status === 'accepted' ? 'Accepted' : d.status === 'declined' ? 'Declined' : d.status === 'expired' ? 'Expired' : 'Read and answer'
  return d.status === 'signed' ? 'Signed' : d.status === 'void' ? 'Void' : 'Read and sign'
}

function open(d: PortalDoc): boolean {
  return ['sent', 'draft'].includes(d.status)
}

function sub(d: PortalDoc): string {
  const parts: string[] = []
  if (d.number != null) parts.push(`#${d.number}`)
  if (d.dueAt) parts.push(`due ${day(d.dueAt)}`)
  else if (d.validUntil) parts.push(`good until ${day(d.validUntil)}`)
  else parts.push(day(d.createdAt))
  return parts.join(' · ')
}
</script>

<template>
  <section class="ap-docs">
    <p v-if="!docs.length" class="ap-empty">No {{ NOUN[props.kind] }} yet.</p>
    <ul v-else class="ap-list">
      <li v-for="d in docs" :key="d.id">
        <a :href="d.url" class="ap-row" :class="{ open: open(d) }" target="_blank" rel="noopener">
          <span class="ap-title">
            <span class="ap-name">{{ d.title }}</span>
            <span class="ap-mono ap-sub">{{ sub(d) }}</span>
          </span>
          <span class="ap-mono ap-amount">{{ money(d.totalCents, d.currency ?? 'usd') }}</span>
          <span class="ap-mono ap-verb">{{ verb(d) }} ↗</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ap-empty {
  margin: 0;
  color: var(--ap-ink-soft);
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
  align-items: center;
  gap: 1.2rem;
  padding: 0.9rem 0;
  border-bottom: var(--ap-line);
  color: inherit;
  text-decoration: none;
}

.ap-row:hover .ap-verb {
  color: var(--ap-accent);
}

.ap-row.open .ap-verb {
  color: var(--ap-accent);
}

.ap-title {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ap-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ap-ink);
}

.ap-mono {
  font-family: var(--ap-mono);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
}

.ap-sub {
  color: var(--ap-ink-soft);
}

.ap-amount {
  font-variant-numeric: tabular-nums;
  color: var(--ap-ink);
}

.ap-verb {
  color: var(--ap-ink-soft);
  white-space: nowrap;
}

@media (max-width: 560px) {
  .ap-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .ap-amount {
    grid-column: 2;
  }

  .ap-verb {
    grid-column: 1 / -1;
  }
}
</style>
