import Vue from 'vue'
import VueRouter from 'vue-router'
import axios from 'axios'
import App from './App.vue'

import Home from './components/HelloWorld.vue'

Vue.config.productionTip = false
Vue.prototype.$http = axios

Vue.use(VueRouter)

let router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/home', component: Home}
  ]
})

new Vue({
  router,
  render: c => c(App),
}).$mount('#app')
