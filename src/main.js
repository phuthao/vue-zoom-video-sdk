import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ZoomLogin from './components/page/ZoomLogin.vue'

//import router from './router';


const router = createRouter({
    history: createWebHistory(),
    routes: [
       { path: '/', component: ZoomLogin },
       { path: '/ZoomLogin', component: ZoomLogin },
      { path: '/:dynamicPath(.*)', component:ZoomLogin }, // Dynamic route capturing all segments after the domain
    ],

});

// router.beforeEach((to, from, next) => {
//   console.log(`Navigating from ${from.path} to ${to.path}`);
//   next(); // Ensure to call next() to continue navigation
// });

createApp(App).use(router).mount('#app')
