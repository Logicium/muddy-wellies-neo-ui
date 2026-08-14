<script setup lang="ts">
import { content } from '@/data/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <span class="mono-label">{{ content.photographer }} · {{ content.location }}</span>
      <span class="mono-label footer-tag">Muddy boots welcome</span>
      <div class="footer-links">
        <a :href="content.instagram" target="_blank" rel="noopener" class="mono-label footer-link">
          Instagram
        </a>
        <span class="mono-label">© {{ year }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding: 1.6rem 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-tag { color: var(--muted-2); }

.footer-links {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.footer-link { transition: color var(--t-ui) ease; }
.footer-link:hover { color: var(--accent); }

@media (max-width: 640px) {
  .footer-tag { display: none; }
}
</style>
