import { kitEnvWith } from '../env'
import { kitFetch, type KitResult } from '../client'
import { createApotomeAccount, type ApotomeAccount } from '../shop/account'
import type { PortalContext, PortalOverview } from './types'

/**
 * The headless half of the customer portal.
 *
 * Composes the account module rather than duplicating it, so a site that
 * uses both shares one session under one storage key. Nothing here renders;
 * the components in this folder read from it, and a site that wants its
 * own design can too.
 *
 * Framework-agnostic on purpose: no Vue import.
 */

export interface ApotomePortalOptions {
  siteKey?: string
  apiUrl?: string
  /**
   * Which portal the sign-in email should land on. 'site' means a path on
   * this site (the default, for a vendored portal); 'hosted' means the one
   * Apotome serves. The address itself is built server-side either way.
   */
  portal?: 'hosted' | 'site'
}

export interface ApotomePortal {
  configured: boolean
  account: ApotomeAccount
  signedIn(): boolean
  /** the business and which rooms exist; needs no session */
  context(): Promise<KitResult<PortalContext>>
  /** everything this customer has with the business */
  overview(): Promise<KitResult<PortalOverview>>
  requestLink(email: string): Promise<KitResult<{ message: string }>>
  redeemFromUrl(): Promise<KitResult<unknown> | null>
  signOut(): void
}

const NOT_CONFIGURED: KitResult<never> = { ok: false, error: 'The portal is not set up on this site yet.' }

export function createApotomePortal(opts: ApotomePortalOptions = {}): ApotomePortal {
  const env = kitEnvWith(opts)
  const account = createApotomeAccount(opts)
  const base = env ? `/account/${encodeURIComponent(env.siteKey)}` : ''

  return {
    configured: !!env,
    account,
    signedIn: () => account.signedIn(),

    async context() {
      if (!env) return NOT_CONFIGURED
      return kitFetch<PortalContext>(env, `${base}/context`)
    },

    async overview() {
      if (!env) return NOT_CONFIGURED
      return account.authed<PortalOverview>(`${base}/overview`)
    },

    requestLink: (email) =>
      account.requestLink(email, {
        portal: opts.portal ?? 'site',
        returnPath: opts.portal === 'hosted' ? undefined : typeof window !== 'undefined' ? window.location.pathname : undefined,
      }),

    redeemFromUrl: () => account.redeemFromUrl(),
    signOut: () => account.signOut(),
  }
}
