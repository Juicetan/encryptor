import { createRouter, createWebHashHistory } from 'vue-router'
import SplashView from '../views/SplashView.vue'
import DashboardView from '../views/DashboardView.vue';
/* !!-- routes import start --!! */
import ChatView from '../views/ChatView.vue';
/* !!-- routes import end --!! */

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'splash',
      component: SplashView,
      meta: {
        transition: 'fade'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        transition: 'fade'
      }
    },
    /* !!-- routes start --!! */
    {
      path: '/chat',
      alias: '/chat/join/:roomID',
      name: 'chatView',
      component: ChatView,
      meta: {
        transition: 'fade'
      }
    },
    /* !!-- routes end --!! */
    
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
