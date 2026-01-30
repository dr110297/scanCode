<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>配货列表</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入发货计划单号筛选"
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
          <!-- 第一行：发货计划单号 + 状态 + 确认配货按钮 -->
          <div class="list-card-header">
            <div class="header-left">
              <span class="purchase-no">{{ item.shipPlanNo || '-' }}</span>
              <span :class="['status-badge', getStatusClass(item.planStatus)]">
                {{ getStatusText(item.planStatus) }}
              </span>
            </div>
            <button class="arrival-btn-small" @click="handleConfirmAllocation(item)">确认配货</button>
          </div>
          <!-- 第二行：总数量 -->
          <div class="list-card-info">
            <span class="info-item">总数量：{{ item.sumQuantity || 0 }}</span>
          </div>
          <!-- 第三行：商品图片列表 -->
          <div class="list-card-images">
            <div
              v-for="(subItem, subIndex) in item.items"
              :key="subIndex"
              class="image-item"
              @click.stop="openPreview(item.items, subIndex)"
            >
              <img
                :src="subItem.mainImage"
                :alt="'商品图片'"
                referrerpolicy="no-referrer"
                @error="handleImageError"
              />
              <span class="image-num">{{ subItem.quantity || 0 }}</span>
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
        <p>暂无配货数据</p>
      </div>
    </div>

    <!-- 扫码器遮罩 -->
    <div v-if="isScanning" class="scanner-overlay">
      <div class="scanner-header">
        <button class="scanner-close-btn" @click="closeScannerOverlay">&times;</button>
        <span>扫描条形码</span>
      </div>
      <div class="scanner-video-container" id="allocation-scanner-video-container"></div>
      <p class="scanner-tip">将条形码对准扫描框</p>
    </div>

    <!-- 图片预览 -->
    <ImagePreview
      :visible.sync="previewVisible"
      :images="previewImages"
      :start-index="previewIndex"
    />
  </div>
</template>

<script>
import { getDesignatedStatusData, confirmAllocated } from '../../api'
import ImagePreview from '../../components/ImagePreview.vue'

// 状态枚举
const STATUS_CLASS_MAP = {
  1: 'processing',
  2: 'completed'
}

const STATUS_TEXT_MAP = {
  1: '待配货',
  2: '待打包'
}

export default {
  name: 'AllocationList',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      PAGE_SIZE: 25,
      listData: [],
      currentPage: 0,
      totalCount: 0,
      isLoadingMore: false,
      hasMoreData: true,
      searchKeyword: '',
      searchDebounceTimer: null,
      previewVisible: false,
      previewImages: [],
      previewIndex: 0,
      isScanning: false,
      html5QrCode: null
    }
  },
  mounted() {
    this.checkRefreshAndLoad()
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if (from.path === '/allocation/detail') {
        vm.checkRefreshAndLoad()
      }
    })
  },
  beforeDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
    this.closeScannerOverlay()
  },
  methods: {
    checkRefreshAndLoad() {
      if (sessionStorage.getItem('refreshAllocationList') === 'true') {
        sessionStorage.removeItem('refreshAllocationList')
        this.currentPage = 0
        this.hasMoreData = true
        this.listData = []
      }
      if (this.listData.length === 0) {
        this.loadListData()
      }
    },
    goBack() {
      this.$router.push('/')
    },
    getStatusClass(value) {
      return STATUS_CLASS_MAP[value] || 'processing'
    },
    getStatusText(value) {
      return STATUS_TEXT_MAP[value] || '未知状态'
    },
    async loadListData(isLoadMore = false) {
      if (this.isLoadingMore || (!this.hasMoreData && isLoadMore)) return

      this.isLoadingMore = true
      if (!isLoadMore) this.showLoading()

      try {
        const params = {
          planStatus: [1],
          platforms: [],
          accountSiteIds: [],
          countrys: [],
          logisticTransportIds: [],
          isSelfProduced: true,
          hasExtraFee: true,
          contentSearches: {
            searchType: 0,
            content: this.searchKeyword || ''
          },
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          sorting: '',
          skipCount: this.currentPage * this.PAGE_SIZE,
          maxResultCount: this.PAGE_SIZE
        }

        const result = await getDesignatedStatusData(params)
        this.totalCount = result.totalCount || 0
        const items = result.items || []

        if (isLoadMore) {
          this.listData = [...this.listData, ...items]
        } else {
          this.listData = items
        }

        this.hasMoreData = this.listData.length < this.totalCount
        this.currentPage++
      } catch (error) {
        console.error('加载列表失败:', error)
        this.showError('加载数据失败，请重试')
      } finally {
        this.isLoadingMore = false
        if (!isLoadMore) this.hideLoading()
      }
    },
    handleScroll() {
      if (this.isLoadingMore || !this.hasMoreData) return

      const container = this.$refs.listContainer
      if (!container) return

      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        this.loadListData(true)
      }
    },
    handleSearchInput() {
      clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.handleSearch()
      }, 500)
    },
    async handleSearch() {
      this.currentPage = 0
      this.hasMoreData = true
      this.listData = []
      await this.loadListData()
    },
    async clearSearch() {
      this.searchKeyword = ''
      await this.handleSearch()
    },
    async handleConfirmAllocation(item) {
      if (!item.id) {
        this.showError('数据异常，无法确认配货')
        return
      }

      this.showLoading()
      try {
        await confirmAllocated([item.id])
        this.showSuccess('确认配货成功')
        // 刷新列表
        this.currentPage = 0
        this.hasMoreData = true
        this.listData = []
        await this.loadListData()
      } catch (error) {
        console.error('确认配货失败:', error)
        this.showError(error.message || '确认配货失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
    openPreview(items, index) {
      this.previewImages = items.map(item => item.mainImage).filter(Boolean)
      this.previewIndex = index
      this.previewVisible = true
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    },
    async handleScan() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showError('当前浏览器不支持摄像头功能')
        return
      }

      if (!window.isSecureContext) {
        this.showError('请使用 HTTPS 协议访问本页面以启用摄像头功能')
        return
      }

      await this.startCameraScanning()
    },
    async startCameraScanning() {
      if (this.isScanning) return

      try {
        this.isScanning = true
        await this.$nextTick()

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        this.html5QrCode = new Html5Qrcode('allocation-scanner-video-container')

        const container = document.getElementById('allocation-scanner-video-container')
        const containerWidth = container ? container.clientWidth : 350
        const containerHeight = container ? container.clientHeight : 400
        const qrboxWidth = Math.floor(containerWidth * 0.85)
        const qrboxHeight = Math.floor(containerHeight * 0.5)

        const config = {
          fps: 15,
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ]
        }

        await this.html5QrCode.start(
          { facingMode: { exact: 'environment' } },
          config,
          async (decodedText) => {
            console.log('扫描到条码:', decodedText)
            await this.closeScannerOverlay()
            this.searchKeyword = decodedText
            await this.handleSearch()
          },
          () => {}
        )
      } catch (error) {
        console.error('摄像头访问失败:', error)
        await this.closeScannerOverlay()

        const errorMessages = {
          NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
          NotFoundError: '未找到摄像头设备',
          NotReadableError: '摄像头被其他应用占用'
        }
        this.showError(errorMessages[error.name] || '无法启动摄像头扫码')
      }
    },
    async closeScannerOverlay() {
      this.isScanning = false

      if (this.html5QrCode) {
        try {
          const { Html5QrcodeScannerState } = await import('html5-qrcode')
          if (this.html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
            await this.html5QrCode.stop()
          }
        } catch (e) {
          console.log('停止扫描器时出错:', e)
        }
        this.html5QrCode = null
      }
    }
  }
}
</script>
