/**
 * Who this site is, for search engines and assistants.
 *
 * The one record behind every title suffix, canonical, share card, robots
 * policy and the Person node on the home page. Pure data: the prerender
 * imports it under Node and the app imports it in the browser.
 *
 * Every fact here is read from src/data/site.ts or the repo. The contact
 * email in the data module is a placeholder, so it is left out of the entity
 * on purpose. No town is stated anywhere in the repo, only "Southern
 * Colorado", so there is no postal address.
 */
import type { SiteConfig } from '@/seo'
import { content } from '@/data/site'

export const site: SiteConfig = {
  siteUrl: 'https://muddywelliesphotography.com',
  name: content.name,
  tagline: 'Documentary photographer, Colorado',
  description:
    'Muddy Wellies Photography is Ashley Montoya, a documentary photographer in Southern Colorado: portraits, brand shoots, ranch and rodeo work, full of movement.',
  lang: 'en',
  locale: 'en_US',
  image: { url: '/og/default.png', width: 1200, height: 630, alt: 'Muddy Wellies Photography, documentary photography in Southern Colorado' },
  entity: {
    type: 'Person',
    name: content.photographer,
    description:
      'Ashley Montoya photographs in rural Southern Colorado under the name Muddy Wellies: documentary portraits, branding for small businesses, ranch and rodeo work, and the places the road goes.',
    image: '/photos/web/072-img-7284.webp',
    jobTitle: 'Photographer',
    worksFor: { name: content.name, url: 'https://muddywelliesphotography.com/' },
    sameAs: [content.instagram],
    knowsAbout: ['Documentary photography', 'Portrait photography', 'Brand photography', 'Ranch and rodeo photography', 'Video and drone content'],
    extra: {
      homeLocation: { '@type': 'Place', name: content.location },
      brand: { '@type': 'Brand', name: content.name },
    },
  },
  // creative work: the photographs are hers, so training crawlers are blocked
  crawlers: { training: 'block' },
  privatePrefixes: ['/account', '/api'],
  llmsSummary:
    'Muddy Wellies Photography is Ashley Montoya, a documentary photographer born in the Scottish Highlands and based in Southern Colorado. She shoots portraits, branding for small businesses, ranch and rodeo work and brand campaigns with stills and video, and keeps a journal of her shoots.',
}
