/**
 * The wire shapes the portal reads, written down once on the client.
 *
 * Mirrors the service's customer-portal.types.ts and the views the shop,
 * schedule and ticket modules already return. Optional members are staged
 * deploy insurance: read every one with a fallback.
 */

export type PortalSection =
  | 'orders'
  | 'appointments'
  | 'tickets'
  | 'quotes'
  | 'invoices'
  | 'agreements'
  | 'galleries'

export interface PortalBusiness {
  name: string
  legalName: string
  email: string | null
  phone: string | null
  address: string | null
  timezone: string
  siteUrl: string | null
  logoUrl: string | null
  accent: string | null
  paper: string | null
  ink: string | null
}

export interface PortalContext {
  business: PortalBusiness
  sections: PortalSection[]
}

export interface PortalCustomer {
  id: number
  email: string
  name: string | null
  phone: string | null
  emailVerified: boolean
  marketingConsent: boolean
}

export interface PortalDoc {
  id: number
  kind: 'quote' | 'invoice' | 'agreement'
  number: number | null
  title: string
  status: string
  totalCents: number | null
  currency: string | null
  dueAt: string | null
  validUntil: string | null
  createdAt: string
  url: string
}

export interface PortalOrder {
  id: number
  status: string
  fulfillment: 'pickup' | 'shipping'
  items: { productName: string; variantLabel: string | null; quantity: number; unitCents: number }[]
  totalCents: number
  currency: string
  trackingUrl?: string | null
  createdAt: string
}

export interface PortalAppointment {
  id: number
  status: string
  serviceName: string
  when: string
  startsAt: string
  durationMinutes: number
  location: string | null
  depositCents: number
}

export interface PortalTicketOrder {
  id: number
  status: string
  eventTitle: string
  startsAt: string
  timezone: string
  totalCents: number
  tickets: { id: number; code: string; tierLabel: string; status: string; qrUrl: string }[]
}

export interface PortalOverview {
  me: PortalCustomer
  sections: PortalSection[]
  orders?: PortalOrder[]
  appointments?: PortalAppointment[]
  tickets?: PortalTicketOrder[]
  quotes?: PortalDoc[]
  invoices?: PortalDoc[]
  agreements?: PortalDoc[]
  galleries?: unknown[]
}
