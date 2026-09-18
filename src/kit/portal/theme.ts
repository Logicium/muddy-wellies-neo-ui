import type { PortalBusiness } from './types'

/**
 * The whole theme API is a handful of custom properties on the portal's
 * root. A vendored portal inherits whatever the host site sets for them;
 * the hosted portal sets them here from the business's own brand. Nothing
 * else in the components is a colour.
 */
export function applyPortalTheme(el: HTMLElement | null, business: PortalBusiness | null): void {
  if (!el || !business) return
  if (business.accent) el.style.setProperty('--ap-accent', business.accent)
  if (business.paper) el.style.setProperty('--ap-paper', business.paper)
  if (business.ink) el.style.setProperty('--ap-ink', business.ink)
}

/** "$12.50" from cents; the portal shows money in one shape everywhere. */
export function money(cents: number | null | undefined, currency = 'usd'): string {
  if (cents == null) return ''
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

export function day(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
