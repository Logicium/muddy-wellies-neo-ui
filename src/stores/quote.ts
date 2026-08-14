import { defineStore } from 'pinia'

export interface QuoteSelection {
  tierSlug: string
  tierTitle: string
  base: number
  addons: { label: string; price: number }[]
  total: number
}

// Carries a built quote from The Gritty Details to the contact form,
// where it arrives as a prefilled itemized message.
export const useQuoteStore = defineStore('quote', {
  state: () => ({
    selection: null as QuoteSelection | null,
  }),
  actions: {
    set(selection: QuoteSelection) {
      this.selection = selection
    },
    clear() {
      this.selection = null
    },
    /** Plain-text itemization for the contact textarea. */
    toMessage(): string {
      const s = this.selection
      if (!s) return ''
      const lines = [
        `Hi Ashley! I put together a quote on your site:`,
        ``,
        `${s.tierTitle} (from $${s.base.toLocaleString()})`,
        ...s.addons.map((a) => `+ ${a.label} ($${a.price.toLocaleString()})`),
        ``,
        `Estimated total: $${s.total.toLocaleString()}`,
        ``,
        `Here's what I have in mind:`,
      ]
      return lines.join('\n')
    },
  },
})
