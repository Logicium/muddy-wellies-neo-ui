/**
 * Post-build: one HTML file per public route, sitemap.xml, robots.txt,
 * llms.txt and 404.html, from the route table and site config.
 *
 *   npm run build        runs this through the postbuild hook
 *   npx vite-node scripts/prerender.ts
 *
 * Every page carries a body built from src/data, so no browser is needed.
 * Journal entries are read from the portal when it answers and from the
 * bundled posts when it does not. The Apotome Labs SEO + AEO Standard,
 * section 13.
 */
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { prerender } from '../src/seo/node'
import { publicRoutes } from '../src/routes'
import { site } from '../src/seo.site'

const root = fileURLToPath(new URL('..', import.meta.url))

/*
 * .env.production (and Vercel's variables) decide which API the build reads
 * from. vite-node copies the DEVELOPMENT env file into process.env before this
 * script runs, so a value that matches .env (localhost) is that file's, not the
 * host's, and the production file wins over it. A real build variable differs
 * from the dev file and is kept.
 */
// loadEnv lets process.env win over the files, so read the files on their own
const inherited: Record<string, string> = {}
for (const key of Object.keys(process.env)) {
  if (key.startsWith('VITE_') && process.env[key] !== undefined) {
    inherited[key] = process.env[key]!
    delete process.env[key]
  }
}
const prod = loadEnv('production', root, 'VITE_')
const dev = loadEnv('development', root, 'VITE_')
Object.assign(process.env, inherited)
const env: Record<string, string | undefined> = { ...prod }
for (const [key, value] of Object.entries(inherited)) {
  if (key in dev && dev[key] === value && key in prod) continue
  env[key] = value
}
// the route table reads the site key from process.env under Node
if (env.VITE_APOTOME_SITE_KEY) process.env.VITE_APOTOME_SITE_KEY = env.VITE_APOTOME_SITE_KEY

await prerender({
  apiUrl: env.VITE_APOTOME_API_URL ?? env.VITE_API_URL,
  site,
  routes: publicRoutes,
  root: new URL('..', import.meta.url),
  llmsFull: true,
})
