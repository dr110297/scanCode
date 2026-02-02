import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 到货模块
const ArrivalList = () => import('../views/arrival/List.vue')
const ArrivalDetail = () => import('../views/arrival/Detail.vue')

// 配货模块
const AllocationList = () => import('../views/allocation/List.vue')

// 打包模块
const PackingList = () => import('../views/packing/List.vue')
const BoxList = () => import('../views/packing/BoxList.vue')
const BoxDetail = () => import('../views/packing/BoxDetail.vue')

// 盘点模块
const InventoryIndex = () => import('../views/inventory/Index.vue')
const InventoryList = () => import('../views/inventory/List.vue')
const InventoryDetail = () => import('../views/inventory/Detail.vue')
const NoPurchaseOrder = () => import('../views/inventory/NoPurchaseOrder.vue')

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
  // 配货模块路由
  {
    path: '/allocation/list',
    name: 'AllocationList',
    component: AllocationList
  },
  // 打包模块路由
  {
    path: '/packing/list',
    name: 'PackingList',
    component: PackingList
  },
  {
    path: '/packing/box-list',
    name: 'BoxList',
    component: BoxList
  },
  {
    path: '/packing/box-detail',
    name: 'BoxDetail',
    component: BoxDetail
  },
  // 盘点模块路由
  {
    path: '/inventory/index',
    name: 'InventoryIndex',
    component: InventoryIndex
  },
  {
    path: '/inventory/list',
    name: 'InventoryList',
    component: InventoryList
  },
  {
    path: '/inventory/detail',
    name: 'InventoryDetail',
    component: InventoryDetail
  },
  {
    path: '/inventory/no-purchase-order',
    name: 'NoPurchaseOrder',
    component: NoPurchaseOrder
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
