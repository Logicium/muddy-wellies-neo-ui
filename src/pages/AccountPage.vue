<script setup lang="ts">
/**
 * A client's own account: their galleries, their invoices, their details.
 *
 * The portal itself is Apotome kit, vendored into src/kit/portal. This page
 * only gives it a place to stand and teaches it the site's two colorways:
 * every `--ap-*` custom property below is one of ours, so the portal
 * follows the MUD and BONE toggle like everything else on the site.
 */
import { CustomerPortal } from '../kit/portal'
</script>

<template>
  <main class="account">
    <section class="section container">
      <CustomerPortal portal="site" />
    </section>
  </main>
</template>

<style scoped>
.account :deep(.apotome-portal) {
  --ap-paper: var(--bg);
  --ap-paper-dim: var(--bg-raised);
  --ap-ink: var(--ink);
  --ap-ink-soft: var(--muted);
  --ap-accent: var(--accent);
  --ap-line: 1px solid var(--line);
  --ap-font: var(--font-body);
  --ap-font-display: var(--font-display);
  --ap-mono: var(--font-mono);
  --ap-radius: 0;
  padding-left: 0;
  padding-right: 0;
  max-width: none;
}
</style>
