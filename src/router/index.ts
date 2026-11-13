import { createRouter, createWebHistory } from 'vue-router'
import { notFoundRoute, publicRoutes } from '@/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...publicRoutes,
    /* a client's own account: galleries, invoices, details; the Apotome kit portal, in our colours */
    { path: '/account', name: 'account', component: () => import('../pages/AccountPage.vue') },
    // a shared gallery's deep link; the portal reads the query and opens it
    { path: '/account/gallery/:id', redirect: (to) => ({ path: '/account', query: { tab: 'galleries', gallery: String(to.params.id) } }) },
    // earlier brand-voice paths, kept as redirects
    { path: '/the-muck', redirect: '/work' },
    { path: '/the-gritty-details', redirect: '/rates' },
    { path: '/wanderings', redirect: '/journal' },
    { path: '/wanderings/:slug', redirect: (to) => `/journal/${to.params.slug}` },
    { path: '/howdy', redirect: '/about' },
    { path: '/shoot-me-a-line', redirect: '/contact' },
    notFoundRoute,
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 90, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
