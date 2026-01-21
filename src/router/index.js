import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 到货模块
const ArrivalList = () => import('../views/arrival/List.vue')
const ArrivalDetail = () => import('../views/arrival/Detail.vue')

// 收货模块
const ReceiveList = () => import('../views/receive/List.vue')
const ReceiveDetail = () => import('../views/receive/Detail.vue')

// 首页
const Home = () => import('../views/Home.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // 到货模块路由
  {
    path: '/arrival/list',
    name: 'ArrivalList',
    component: ArrivalList
  },
  {
    path: '/arrival/detail',
    name: 'ArrivalDetail',
    component: ArrivalDetail
  },
  // 收货模块路由
  {
    path: '/receive/list',
    name: 'ReceiveList',
    component: ReceiveList
  },
  {
    path: '/receive/detail',
    name: 'ReceiveDetail',
    component: ReceiveDetail
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
