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
          <!-- 第一行：采购单号 + 状态 + 到货按钮 -->
          <div class="list-card-header">
            <div class="header-left">
              <span class="purchase-no">{{ item.purchaseNo || '-' }}</span>
              <span :class="['status-badge', getStatusClass(item.status)]">
                {{ item.statusDesc }}
              </span>
            </div>
            <button class="arrival-btn-small" @click="goToDetail(item)">到货</button>
          </div>
          <!-- 第二行：采购人 + 业务人 -->
          <div class="list-card-info">
            <span class="info-item">采购：{{ item.purchaserName || '-' }}</span>
            <span class="info-item">业务：{{ item.belongsUserName || '-' }}</span>
          </div>
          <!-- 第三行：商品图片列表 -->
          <div class="list-card-images">
            <div
              v-for="(subItem, subIndex) in item.items"
              :key="subItem.id"
              class="image-item"
              @click.stop="openPreview(item.items, subIndex)"
            >
              <img
                :src="getThumbnailUrl(subItem.mainImage)"
                :alt="subItem.productName"
                referrerpolicy="no-referrer"
                @error="handleImageError"
              />
              <span class="image-num">{{ subItem.num || 0 }}</span>
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

    <!-- 图片预览 -->
    <ImagePreview
      :visible.sync="previewVisible"
      :images="previewImages"
      :start-index="previewIndex"
    />
  </div>
</template>

<script>
import { getPdaListPaged, getPurchaseOrderByNo } from '../../api'
import ImagePreview from '../../components/ImagePreview.vue'

// 状态枚举: -3:草稿, 0:待下单, 1:待到货, 2:已完成, 3:已取消
const STATUS_CLASS_MAP = {
  '-3': 'draft',
  0: 'pending',
  1: 'processing',
  2: 'completed',
  3: 'cancelled'
}

export default {
  name: 'ArrivalList',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError'],
  data() {
    return {
      PAGE_SIZE: 25,
      listData: [],
      currentPage: 1,
      totalCount: 0,
      isLoadingMore: false,
      hasMoreData: true,
      searchKeyword: '',
      isScanning: false,
      html5QrCode: null,
      searchDebounceTimer: null,
      previewVisible: false,
      previewImages: [],
      previewIndex: 0
    }
  },
  mounted() {
    this.checkRefreshAndLoad()
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if (from.path === '/arrival/detail') {
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
    // 生成缩略图URL
    getThumbnailUrl(url) {
      if (!url) return ''
      // 添加缩略图参数
      return url + '?imageView2/w/75/h/75'
    },
    checkRefreshAndLoad() {
      if (sessionStorage.getItem('refreshList') === 'true') {
        sessionStorage.removeItem('refreshList')
        this.currentPage = 1
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
    calcItemStats(item) {
      const items = item.items || []
      return {
        totalNum: items.reduce((sum, i) => sum + (i.num || 0), 0),
        arrivalNum: items.reduce((sum, i) => sum + (i.arrivalNum || 0), 0),
        abnormalNum: items.reduce((sum, i) => sum + (i.abnormalNum || 0), 0)
      }
    },
    async loadListData(isLoadMore = false) {
      if (this.isLoadingMore || (!this.hasMoreData && isLoadMore)) return

      this.isLoadingMore = true
      if (!isLoadMore) this.showLoading()

      try {
        const params = {
          skipCount: this.currentPage,
          maxResultCount: this.PAGE_SIZE
        }

        if (this.searchKeyword) {
          params.contentSearches = {
            searchType: 0,
            content: this.searchKeyword
          }
        }

        const result = await getPdaListPaged(params)
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
      this.currentPage = 1
      this.hasMoreData = true
      this.listData = []
      await this.loadListData()
    },
    async clearSearch() {
      this.searchKeyword = ''
      await this.handleSearch()
    },
    async goToDetail(item) {
      this.showLoading()
      try {
        const detailData = await getPurchaseOrderByNo(item.purchaseNo)
        sessionStorage.setItem('detailData', JSON.stringify(detailData))
        sessionStorage.setItem('previousPage', 'arrival-list')
        this.$router.push('/arrival/detail')
      } catch (error) {
        console.error('获取详情失败:', error)
        this.showError('获取详情失败，请重试')
      } finally {
        this.hideLoading()
      }
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
        this.html5QrCode = new Html5Qrcode('scanner-video-container', { verbose: false })

        // 优化的扫描配置 - 全屏扫描
        const config = {
          fps: 15,
          aspectRatio: 1.777778,
          disableFlip: false,
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

        // 视频约束配置
        const cameraConfig = {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }

        // 检查是否支持原生BarcodeDetector API
        if ('BarcodeDetector' in window) {
          console.log('浏览器支持原生BarcodeDetector API，性能最佳')
        }

        await this.html5QrCode.start(
          cameraConfig,
          config,
          async (decodedText) => {
            console.log('扫描到条码:', decodedText)
            await this.closeScannerOverlay()
            await this.fetchPurchaseOrderByNo(decodedText)
          },
          () => {}
        )
        console.log('摄像头已启动，解码器已自动选择最优可用后端')
      } catch (error) {
        console.error('摄像头访问失败:', error)
        await this.closeScannerOverlay()

        const errorMessages = {
          NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
          NotFoundError: '未找到摄像头设备',
          NotReadableError: '摄像头被其他应用占用',
          OverconstrainedError: '摄像头不支持请求的配置'
        }
        this.showError(errorMessages[error.name] || '无法启动摄像头扫码: ' + error.message)
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
    },
    async fetchPurchaseOrderByNo(purchaseNo) {
      this.showLoading()
      try {
        const data = await getPurchaseOrderByNo(purchaseNo)
        sessionStorage.setItem('detailData', JSON.stringify(data))
        sessionStorage.setItem('previousPage', 'arrival-list')
        this.$router.push('/arrival/detail')
      } catch (error) {
        console.error('获取采购单信息错误:', error)
        this.showError('获取采购单信息失败，请重试')
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
    }
  }
}
</script>
