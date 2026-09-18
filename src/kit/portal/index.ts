/**
 * Apotome customer portal - entry point.
 *
 * A business's customers sign in by emailed link and see everything they
 * have with that business: galleries, invoices to pay, quotes and
 * agreements to sign, orders, bookings, tickets, and their own details.
 *
 * Vendor the whole `portal/` folder into a client site's `src/kit/`, along
 * with `env.ts`, `client.ts` and `shop/account.ts`, and mount it one of two
 * ways:
 *
 *   // a site with a router: point a route at the component
 *   import { CustomerPortal } from '@/kit/portal'
 *   { path: '/account', component: CustomerPortal }
 *
 *   // a site with no route to spare: its own app on any element
 *   import { mountApotomePortal } from '@/kit/portal'
 *   mountApotomePortal({ el: document.querySelector('#account')! })
 *
 * Theming is a handful of custom properties on `.apotome-portal`:
 * `--ap-paper`, `--ap-ink`, `--ap-accent`, `--ap-font`, `--ap-mono`,
 * `--ap-radius`. Set them from the site's own CSS and the portal takes the
 * site's look. Nothing inside it is a colour of its own.
 *
 * These files are Vue single-file components, so unlike the headless kit
 * modules they need a Vue build. Every site in the fleet has one.
 */
import { createApp } from 'vue'
import CustomerPortal from './CustomerPortal.vue'
import type { ApotomePortalOptions } from './portal'

export { default as CustomerPortal } from './CustomerPortal.vue'
export { createApotomePortal } from './portal'
export type { ApotomePortal, ApotomePortalOptions } from './portal'
export { applyPortalTheme } from './theme'
export type * from './types'

/** For a site that has no room for a route: its own tiny app on an element. */
export function mountApotomePortal(opts: ApotomePortalOptions & { el: HTMLElement }): () => void {
  const app = createApp(CustomerPortal, { siteKey: opts.siteKey, apiUrl: opts.apiUrl, portal: opts.portal })
  app.mount(opts.el)
  return () => app.unmount()
}
