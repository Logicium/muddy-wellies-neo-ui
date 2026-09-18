import { kitEnvWith } from '../env'
import { kitFetch, type KitResult } from '../client'

/**
 * A customer's account on a business's site, wired to the Apotome commerce
 * service.
 *
 * Sign-in is by emailed link, never by password: the site calls requestLink,
 * the customer taps the email, lands back on the site with ?ct=..., and
 * redeemFromUrl turns that into a session. The token lives in the site's own
 * localStorage under a key scoped to the site, so two client sites on one
 * browser never share a customer.
 *
 * Framework-agnostic on purpose: no Vue import, so the same file drops into a
 * React or plain-DOM site unchanged.
 */

export interface ApotomeCustomer {
  id: number
  email: string
  name: string | null
  phone: string | null
  emailVerified: boolean
  marketingConsent: boolean
}

export interface ApotomeAddress {
  id: number
  label: string | null
  name: string
  line1: string
  line2: string | null
  city: string
  region: string
  postal: string
  country: string
  phone: string | null
  isDefault: boolean
}

export type ApotomeAddressInput = Omit<ApotomeAddress, 'id' | 'isDefault'> & { isDefault?: boolean }

export interface ApotomeAccountOptions {
  siteKey?: string
  apiUrl?: string
}

export interface ApotomeAccount {
  /** true once the environment is wired; false means every call is a no-op */
  configured: boolean
  /** whether a session token is held; not proof it is still valid */
  signedIn(): boolean
  /**
   * Asks for a sign-in email. `returnPath` is where the link lands on this
   * site; `portal: 'hosted'` asks for the portal Apotome serves instead. The
   * address itself is built server-side either way.
   */
  requestLink(email: string, opts?: { returnPath?: string; portal?: 'hosted' | 'site' }): Promise<KitResult<{ message: string }>>
  /** a signed-in GET or write against the account's own paths; used by the portal module */
  authed<T>(path: string, init?: RequestInit): Promise<KitResult<T>>
  /**
   * Redeems a ?ct= token from the current URL, stores the session, and strips
   * the token from the address bar. Returns null when there was no token.
   */
  redeemFromUrl(): Promise<KitResult<ApotomeCustomer> | null>
  me(): Promise<KitResult<ApotomeCustomer>>
  update(patch: Partial<Pick<ApotomeCustomer, 'name' | 'phone' | 'marketingConsent'>>): Promise<KitResult<ApotomeCustomer>>
  addresses(): Promise<KitResult<ApotomeAddress[]>>
  addAddress(input: ApotomeAddressInput): Promise<KitResult<ApotomeAddress>>
  updateAddress(id: number, patch: Partial<ApotomeAddressInput>): Promise<KitResult<ApotomeAddress>>
  removeAddress(id: number): Promise<KitResult<unknown>>
  signOut(): void
}

const NOT_CONFIGURED: KitResult<never> = { ok: false, error: 'Accounts are not set up on this site yet.' }
const NOT_SIGNED_IN: KitResult<never> = { ok: false, error: 'Sign in first.' }

export function createApotomeAccount(opts: ApotomeAccountOptions = {}): ApotomeAccount {
  const env = kitEnvWith(opts)
  const storageKey = env ? `apotome_customer_token:${env.siteKey}` : ''

  const read = (): string | null => {
    try {
      return storageKey ? localStorage.getItem(storageKey) : null
    } catch {
      return null
    }
  }
  const write = (token: string | null) => {
    try {
      if (!storageKey) return
      if (token) localStorage.setItem(storageKey, token)
      else localStorage.removeItem(storageKey)
    } catch {
      /* private mode */
    }
  }

  const authed = <T>(path: string, init?: RequestInit): Promise<KitResult<T>> => {
    if (!env) return Promise.resolve(NOT_CONFIGURED)
    const token = read()
    if (!token) return Promise.resolve(NOT_SIGNED_IN)
    return kitFetch<T>(env, path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
    }).then((r) => {
      // a dead token is dropped so the next call asks for a fresh sign-in
      if (!r.ok && /sign in/i.test(r.error)) write(null)
      return r
    })
  }

  const base = env ? `/account/${encodeURIComponent(env.siteKey)}` : ''

  return {
    configured: !!env,

    signedIn: () => !!read(),

    async requestLink(email, opts) {
      if (!env) return NOT_CONFIGURED
      const portal = opts?.portal ?? 'site'
      const path =
        portal === 'hosted'
          ? undefined
          : (opts?.returnPath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined))
      return kitFetch(env, `${base}/login-link`, {
        method: 'POST',
        body: JSON.stringify({ email, returnPath: path, portal }),
      })
    },

    authed,

    async redeemFromUrl() {
      if (!env || typeof window === 'undefined') return null
      const url = new URL(window.location.href)
      const ct = url.searchParams.get('ct')
      if (!ct) return null
      const res = await kitFetch<{ token: string; customer: ApotomeCustomer }>(env, `${base}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ token: ct }),
      })
      // the token is single use either way; it must not linger in the bar
      url.searchParams.delete('ct')
      window.history.replaceState({}, '', url.toString())
      if (!res.ok) return res
      write(res.data.token)
      return { ok: true, data: res.data.customer }
    },

    me: () => authed<ApotomeCustomer>(`${base}/me`),

    update: (patch) =>
      authed<ApotomeCustomer>(`${base}/me`, { method: 'PATCH', body: JSON.stringify(patch) }),

    addresses: () => authed<ApotomeAddress[]>(`${base}/addresses`),

    addAddress: (input) =>
      authed<ApotomeAddress>(`${base}/addresses`, { method: 'POST', body: JSON.stringify(input) }),

    updateAddress: (id, patch) =>
      authed<ApotomeAddress>(`${base}/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

    removeAddress: (id) => authed(`${base}/addresses/${id}`, { method: 'DELETE' }),

    signOut: () => write(null),
  }
}
