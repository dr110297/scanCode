<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>到货列表</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入采购单号筛选"
          @input="handleSearchInput"
          @keypress.enter="handleSearch"
        />
        <button
          v-if="searchKeyword"
          class="clear-btn"
          @click="clearSearch"
        >
          &times;
        </button>
      </div>
      <button class="scan-icon-btn" @click="handleScan">
        <span class="scan-icon"></span>
      </button>
    </div>

    <!-- 列表容器 -->
    <div class="list-container" ref="listContainer" @scroll="handleScroll">
      <div class="list-content">
        <div
          v-for="item in listData"
          :key="item.id"
          class="list-card"
        >
          <div class="list-card-header">
            <span class="purchase-no">{{ item.purchaseNo || '-' }}</span>
            <button class="detail-btn" @click="goToDetail(item)">详情</button>
          </div>
          <div class="list-card-body">
            <div class="list-info-row">
              <span class="list-label">状态</span>
              <span :class="['status-badge', getStatusClass(item.status?.value)]">
                {{ item.status?.name || '未知' }}
              </span>
            </div>
            <div class="list-info-row">
              <span class="list-label">归属人</span>
              <span class="list-value">{{ item.belongsUserName || '-' }}</span>
            </div>
            <div class="list-info-row">
              <span class="list-label">采购方</span>
              <span class="list-value">{{ item.purchaserName || '-' }}</span>
            </div>
            <div class="list-stats">
              <div class="stat-mini">
                <span class="stat-num">{{ calcItemStats(item).totalNum }}</span>
                <span class="stat-text">总数</span>
              </div>
              <div class="stat-mini success">
                <span class="stat-num">{{ calcItemStats(item).arrivalNum }}</span>
                <span class="stat-text">已到货</span>
              </div>
              <div :class="['stat-mini', calcItemStats(item).abnormalNum > 0 ? 'danger' : '']">
                <span class="stat-num">{{ calcItemStats(item).abnormalNum }}</span>
                <span class="stat-text">异常</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="isLoadingMore" class="loading-more">
        <div class="loading-spinner-small"></div>
        <span>加载中...</span>
      </div>

      <!-- 没有更多数据 -->
      <div v-if="!hasMoreData && listData.length > 0" class="no-more-data">
        <span>没有更多数据了</span>
      </div>

      <!-- 空状态 -->
      <div v-if="listData.length === 0 && !isLoadingMore" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>暂无到货数据</p>
      </div>
    </div>

    <!-- 扫码器遮罩 -->
    <div v-if="isScanning" class="scanner-overlay">
      <div class="scanner-header">
        <button class="scanner-close-btn" @click="closeScannerOverlay">&times;</button>
        <span>扫描条形码</span>
      </div>
      <div class="scanner-video-container" id="scanner-video-container"></div>
      <p class="scanner-tip">将条形码对准扫描框</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getPdaListPaged, getPurchaseOrderByNo } from '../api'

const router = useRouter()
const showLoading = inject('showLoading')
const hideLoading = inject('hideLoading')
const showError = inject('showError')

const PAGE_SIZE = 25
const STATUS_CLASS_MAP = {
  0: 'pending',
  1: 'processing',
  2: 'completed',
  3: 'cancelled'
}

// 响应式数据
const listData = ref([])
const currentPage = ref(0)
const totalCount = ref(0)
const isLoadingMore = ref(false)
const hasMoreData = ref(true)
const searchKeyword = ref('')
const listContainer = ref(null)
const isScanning = ref(false)

// 非响应式变量
let html5QrCode = null
let searchDebounceTimer = null

// 状态类名映射
const getStatusClass = (value) => STATUS_CLASS_MAP[value] || 'processing'

// 计算商品统计数据
const calcItemStats = (item) => {
  const items = item.items || []
  return {
    totalNum: items.reduce((sum, i) => sum + (i.num || 0), 0),
    arrivalNum: items.reduce((sum, i) => sum + (i.arrivalNum || 0), 0),
    abnormalNum: items.reduce((sum, i) => sum + (i.abnormalNum || 0), 0)
  }
}

// 返回首页
const goBack = () => router.push('/')

// 加载列表数据
const loadListData = async (isLoadMore = false) => {
  if (isLoadingMore.value || (!hasMoreData.value && isLoadMore)) return

  isLoadingMore.value = true
  if (!isLoadMore) showLoading()

  try {
    const params = {
      skipCount: currentPage.value * PAGE_SIZE,
      maxResultCount: PAGE_SIZE
    }

    if (searchKeyword.value) {
      params.contentSearches = {
        searchType: 0,
        content: searchKeyword.value
      }
    }

    const result = await getPdaListPaged(params)
    totalCount.value = result.totalCount || 0
    const items = result.items || []

    listData.value = isLoadMore ? [...listData.value, ...items] : items
    hasMoreData.value = listData.value.length < totalCount.value
    currentPage.value++
  } catch (error) {
    console.error('加载列表失败:', error)
    showError('加载数据失败，请重试')
  } finally {
    isLoadingMore.value = false
    if (!isLoadMore) hideLoading()
  }
}

// 滚动加载
const handleScroll = () => {
  if (isLoadingMore.value || !hasMoreData.value) return

  const container = listContainer.value
  if (!container) return

  const { scrollTop, scrollHeight, clientHeight } = container
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadListData(true)
  }
}

// 搜索防抖处理
const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(handleSearch, 500)
}

// 执行搜索
const handleSearch = async () => {
  currentPage.value = 0
  hasMoreData.value = true
  listData.value = []
  await loadListData()
}

// 清除搜索
const clearSearch = async () => {
  searchKeyword.value = ''
  await handleSearch()
}

// 跳转详情页
const goToDetail = async (item) => {
  showLoading()
  try {
    const detailData = await getPurchaseOrderByNo(item.purchaseNo)
    sessionStorage.setItem('detailData', JSON.stringify(detailData))
    sessionStorage.setItem('previousPage', 'list')
    router.push('/detail')
  } catch (error) {
    console.error('获取详情失败:', error)
    showError('获取详情失败，请重试')
  } finally {
    hideLoading()
  }
}

// 扫码功能
const handleScan = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    showError('当前浏览器不支持摄像头功能')
    return
  }

  if (!window.isSecureContext) {
    showError('请使用 HTTPS 协议访问本页面以启用摄像头功能')
    return
  }

  await startCameraScanning()
}

// 启动摄像头扫描
const startCameraScanning = async () => {
  if (isScanning.value) return

  try {
    isScanning.value = true
    await nextTick()

    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
    html5QrCode = new Html5Qrcode('scanner-video-container')

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.777778,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E
      ]
    }

    await html5QrCode.start(
      { facingMode: 'environment' },
      config,
      async (decodedText) => {
        console.log('扫描到条码:', decodedText)
        await closeScannerOverlay()
        await fetchPurchaseOrderByNo(decodedText)
      },
      () => {}
    )
  } catch (error) {
    console.error('摄像头访问失败:', error)
    await closeScannerOverlay()

    const errorMessages = {
      NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
      NotFoundError: '未找到摄像头设备',
      NotReadableError: '摄像头被其他应用占用'
    }
    showError(errorMessages[error.name] || '无法启动摄像头扫码')
  }
}

// 关闭扫码器
const closeScannerOverlay = async () => {
  isScanning.value = false

  if (html5QrCode) {
    try {
      const { Html5QrcodeScannerState } = await import('html5-qrcode')
      if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
        await html5QrCode.stop()
      }
    } catch (e) {
      console.log('停止扫描器时出错:', e)
    }
    html5QrCode = null
  }
}

// 根据采购单号获取详情
const fetchPurchaseOrderByNo = async (purchaseNo) => {
  showLoading()
  try {
    const data = await getPurchaseOrderByNo(purchaseNo)
    sessionStorage.setItem('detailData', JSON.stringify(data))
    sessionStorage.setItem('previousPage', 'list')
    router.push('/detail')
  } catch (error) {
    console.error('获取采购单信息错误:', error)
    showError('获取采购单信息失败，请重试')
  } finally {
    hideLoading()
  }
}

// 生命周期
onMounted(() => {
  loadListData()
})

onUnmounted(() => {
  // 清理定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  // 清理扫码器
  closeScannerOverlay()
})
</script>
