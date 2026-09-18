import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/HomePage.vue') },
    { path: '/work', name: 'work', component: () => import('../pages/PortfolioPage.vue') },
    { path: '/rates', name: 'rates', component: () => import('../pages/PricingPage.vue') },
    { path: '/journal', name: 'journal', component: () => import('../pages/BlogIndexPage.vue') },
    { path: '/journal/:slug', name: 'journal-post', component: () => import('../pages/BlogPostPage.vue') },
    { path: '/about', name: 'about', component: () => import('../pages/AboutPage.vue') },
    { path: '/contact', name: 'contact', component: () => import('../pages/ContactPage.vue') },
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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 90, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
