import { kitEnvWith } from './env'
import type { KitResult } from './client'
import { createApotomeAccount, type ApotomeAccount, type ApotomeAccountOptions } from './shop/account'
import type { GalleryCheckoutInput, GalleryOrderView, GallerySummary, GalleryView } from './portal/types'

/**
 * A customer's galleries, headless.
 *
 * For a photography site that wants the data and its own design. The
 * portal components in ./portal read from this same module, so the two
 * cannot drift. Framework-agnostic on purpose: no Vue import.
 */
export interface ApotomeGalleries {
  configured: boolean
  account: ApotomeAccount
  /** galleries shared with the signed-in customer */
  list(): Promise<KitResult<GallerySummary[]>>
  /** one gallery: its images, this customer's picks, the price list */
  one(id: number): Promise<KitResult<GalleryView>>
  select(galleryId: number, imageId: number, kind?: 'favourite' | 'select', note?: string): Promise<KitResult<unknown>>
  unselect(galleryId: number, imageId: number): Promise<KitResult<unknown>>
  /** starts a print order; the customer is sent to `url` to pay */
  checkout(galleryId: number, input: GalleryCheckoutInput): Promise<KitResult<{ orderId: number; url: string }>>
  orders(galleryId: number): Promise<KitResult<GalleryOrderView[]>>
}

const NOT_CONFIGURED: KitResult<never> = { ok: false, error: 'Galleries are not set up on this site yet.' }

export function createApotomeGalleries(opts: ApotomeAccountOptions & { portal?: 'hosted' | 'site' } = {}): ApotomeGalleries {
  const env = kitEnvWith(opts)
  const account = createApotomeAccount(opts)
  const base = env ? `/account/${encodeURIComponent(env.siteKey)}/galleries` : ''
  const authed = <T>(path: string, init?: RequestInit) => (env ? account.authed<T>(path, init) : Promise.resolve(NOT_CONFIGURED))

  return {
    configured: !!env,
    account,
    list: () => authed<GallerySummary[]>(base),
    one: (id) => authed<GalleryView>(`${base}/${id}`),
    select: (g, i, kind = 'select', note) =>
      authed(`${base}/${g}/images/${i}/select`, { method: 'POST', body: JSON.stringify({ kind, ...(note !== undefined ? { note } : {}) }) }),
    unselect: (g, i) => authed(`${base}/${g}/images/${i}/select`, { method: 'DELETE' }),
    checkout: (g, input) =>
      authed<{ orderId: number; url: string }>(`${base}/${g}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ ...input, portal: opts.portal ?? 'site' }),
      }),
    orders: (g) => authed<GalleryOrderView[]>(`${base}/${g}/orders`),
  }
}
