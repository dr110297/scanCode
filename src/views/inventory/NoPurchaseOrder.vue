<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>无采购单盘点</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入SKU、商品名称或货号搜索"
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
      <button class="add-sku-btn" @click="openSkuSelector">
        <i class="el-icon-plus"></i>
      </button>
    </div>

    <!-- 列表容器 -->
    <div class="list-container" ref="listContainer" @scroll="handleScroll">
      <div class="list-content">

      <!-- 列表 -->
        <div
          v-for="item in listData"
          :key="item.id"
          class="list-card"
          @click="goToDetail(item)"
        >
          <div class="list-card-header">
            <div class="header-left">
              <img
                class="list-card-thumb"
                :src="getThumbImage(item.mainImage)"
                referrerpolicy="no-referrer"
                @error="handleImageError"
              />
              <div class="list-card-title">{{ item.productName || '-' }}</div>
            </div>
            <div :class="['status-badge', item.stocktakeNum > 0 ? 'completed' : 'pending']">
              {{ item.stocktakeNum > 0 ? '已盘点' : '待盘点' }}
            </div>
          </div>
          <div class="list-card-body">
            <div class="list-info-row">
              <span class="list-label">SKU</span>
              <span class="list-value">{{ item.sku || '-' }}</span>
            </div>
            <div v-if="item.goodsNumber" class="list-info-row">
              <span class="list-label">货号</span>
              <span class="list-value">{{ item.goodsNumber }}</span>
            </div>
            <div class="list-info-row">
              <span class="list-label">盘点数量</span>
              <span class="list-value" style="color: #1890ff; font-weight: 500;">{{ item.stocktakeNum || 0 }}</span>
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
        <p>暂无盘点数据</p>
      </div>
    </div>

    <!-- SKU选择弹窗 -->
    <el-dialog
      title="选择SKU"
      :visible.sync="showSkuSelector"
      width="90%"
      :close-on-click-modal="false"
      custom-class="sku-dialog"
    >
      <!-- 弹窗内搜索 -->
      <div class="dialog-search-bar">
        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="dialogSearchKeyword"
            placeholder="输入SKU、商品名称或货号搜索"
            @input="handleDialogSearchInput"
          />
          <button
            v-if="dialogSearchKeyword"
            class="clear-btn"
            @click="handleDialogSearchClear"
          >
            &times;
          </button>
        </div>
      </div>
      <div class="sku-options-list" ref="skuOptionsList" @scroll="handleSkuListScroll">
        <div
          v-for="sku in skuList"
          :key="sku.id"
          class="sku-option"
          :class="{ selected: tempSelectedSku && tempSelectedSku.id === sku.id }"
          @click="selectSku(sku)"
        >
          <img
            class="sku-option-image"
            :src="getThumbImage(sku.mainImage)"
            referrerpolicy="no-referrer"
            @error="handleImageError"
          />
          <div class="sku-option-info">
            <div class="sku-option-name">{{ sku.productName || '-' }}</div>
            <div class="sku-option-code">SKU: {{ sku.sku || '-' }}</div>
            <div v-if="sku.goodsNumber" class="sku-option-code">货号: {{ sku.goodsNumber }}</div>
          </div>
          <div v-if="tempSelectedSku && tempSelectedSku.id === sku.id" class="sku-check-icon">
            <i class="el-icon-check"></i>
          </div>
        </div>
        <!-- 加载更多 -->
        <div v-if="isLoadingMoreSku" class="loading-more">
          <i class="el-icon-loading"></i>
          <span>加载中...</span>
        </div>
        <!-- 没有更多数据 -->
        <div v-if="!hasMoreSku && skuList.length > 0" class="no-more-data">
          <span>没有更多数据了</span>
        </div>
        <div v-if="skuList.length === 0 && !isLoadingMoreSku" class="empty-state">
          <p>{{ dialogSearchKeyword ? '未找到匹配的SKU' : '暂无可选SKU' }}</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeSkuSelector">取消</el-button>
        <el-button type="primary" @click="confirmSkuSelection">确定</el-button>
      </span>
    </el-dialog>

    <!-- 扫码器遮罩 -->
    <div v-if="isScanning" class="scanner-overlay">
      <div class="scanner-header">
        <button class="scanner-close-btn" @click="closeScannerOverlay">&times;</button>
        <span>扫描SKU条形码</span>
      </div>
      <div class="scanner-video-container" id="scanner-video-container"></div>
      <p class="scanner-tip">将条形码对准扫描框</p>
    </div>
  </div>
</template>

<script>
import { getCommodityStockTake } from '../../api'

const PAGE_SIZE = 25

export default {
  name: 'NoPurchaseOrder',
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      searchKeyword: '',
      listData: [],
      currentPage: 1,
      totalCount: 0,
      hasMoreData: true,
      isLoadingMore: false,
      // SKU选择弹窗
      showSkuSelector: false,
      dialogSearchKeyword: '',
      skuList: [],
      tempSelectedSku: null,
      skuCurrentPage: 1,
      skuTotalCount: 0,
      hasMoreSku: true,
      isLoadingMoreSku: false,
      dialogSearchTimer: null,
      searchDebounceTimer: null,
      // 扫码
      isScanning: false,
      html5QrCode: null
    }
  },
  mounted() {
    this.loadListData()
  },
  beforeDestroy() {
    if (this.dialogSearchTimer) {
      clearTimeout(this.dialogSearchTimer)
    }
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
    this.closeScannerOverlay()
  },
  methods: {
    goBack() {
      this.$router.push('/inventory/index')
    },
    async loadListData(isLoadMore = false) {
      if (this.isLoadingMore) return

      if (!isLoadMore) {
        this.showLoading()
      }
      this.isLoadingMore = true

      try {
        const params = {
          status: null,
          categoryIds: [],
          platforms: [],
          isAvailable: null,
          isStocktake: true,
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: this.searchKeyword || ''
          },
          sorting: '',
          skipCount: this.currentPage,
          maxResultCount: PAGE_SIZE
        }

        const result = await getCommodityStockTake(params)
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
    goToDetail(item) {
      sessionStorage.setItem('noPurchaseOrderSkuData', JSON.stringify(item))
      this.$router.push('/inventory/no-purchase-order-detail')
    },
    getThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?imageView2/w/75/h/75'
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    },
    // SKU选择弹窗相关方法
    async openSkuSelector() {
      this.dialogSearchKeyword = ''
      this.tempSelectedSku = null
      this.skuList = []
      this.skuCurrentPage = 1
      this.hasMoreSku = true
      this.skuTotalCount = 0
      this.showLoading()
      try {
        const params = {
          status: null,
          categoryIds: [],
          platforms: [],
          isAvailable: null,
          isStocktake: null,
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: ''
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: PAGE_SIZE
        }

        const result = await getCommodityStockTake(params)
        if (result && result.items) {
          this.skuList = result.items
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.skuList.length < this.skuTotalCount
          this.skuCurrentPage = 2
          this.showSkuSelector = true
        }
      } catch (error) {
        console.error('获取SKU列表失败:', error)
        this.showError(error.message || '获取SKU列表失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
    selectSku(sku) {
      this.tempSelectedSku = sku
    },
    handleDialogSearchInput() {
      clearTimeout(this.dialogSearchTimer)
      this.dialogSearchTimer = setTimeout(() => {
        this.handleDialogSearch()
      }, 500)
    },
    async handleDialogSearch() {
      this.skuCurrentPage = 1
      this.hasMoreSku = true
      this.skuTotalCount = 0
      try {
        const params = {
          status: null,
          categoryIds: [],
          platforms: [],
          isAvailable: null,
          isStocktake: null,
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: this.dialogSearchKeyword || ''
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: PAGE_SIZE
        }

        const result = await getCommodityStockTake(params)
        if (result && result.items) {
          this.skuList = result.items
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.skuList.length < this.skuTotalCount
          this.skuCurrentPage = 2
        }
      } catch (error) {
        console.error('搜索SKU失败:', error)
        this.showError(error.message || '搜索失败，请重试')
      }
    },
    async handleDialogSearchClear() {
      this.dialogSearchKeyword = ''
      await this.handleDialogSearch()
    },
    handleSkuListScroll() {
      if (this.isLoadingMoreSku || !this.hasMoreSku) return

      const container = this.$refs.skuOptionsList
      if (!container) return

      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        this.loadMoreSkus()
      }
    },
    async loadMoreSkus() {
      if (this.isLoadingMoreSku || !this.hasMoreSku) return

      this.isLoadingMoreSku = true
      try {
        const params = {
          status: null,
          categoryIds: [],
          platforms: [],
          isAvailable: null,
          isStocktake: null,
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: this.dialogSearchKeyword || ''
          },
          sorting: '',
          skipCount: this.skuCurrentPage,
          maxResultCount: PAGE_SIZE
        }

        const result = await getCommodityStockTake(params)
        if (result && result.items) {
          this.skuList = [...this.skuList, ...result.items]
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.skuList.length < this.skuTotalCount
          this.skuCurrentPage++
        }
      } catch (error) {
        console.error('加载更多SKU失败:', error)
      } finally {
        this.isLoadingMoreSku = false
      }
    },
    async confirmSkuSelection() {
      if (!this.tempSelectedSku) {
        this.showError('请选择一个SKU')
        return
      }

      // 先保存选中的 SKU 数据，因为 closeSkuSelector 会清空 tempSelectedSku
      const selectedSku = { ...this.tempSelectedSku }

      this.showLoading()
      try {
        const params = {
          status: null,
          categoryIds: [],
          platforms: [],
          isAvailable: null,
          isStocktake: null,
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: selectedSku.sku || ''
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: 25
        }

        const result = await getCommodityStockTake(params)
        this.closeSkuSelector()

        if (result && result.items && result.items.length > 0) {
          // 找到匹配的 SKU 数据
          const matchedItem = result.items.find(item => item.id === selectedSku.id) || result.items[0]
          this.goToDetail(matchedItem)
        } else {
          // 如果没有找到匹配数据，使用原始数据
          this.goToDetail(selectedSku)
        }
      } catch (error) {
        console.error('获取SKU数据失败:', error)
        this.closeSkuSelector()
        // 出错时使用原始数据
        this.goToDetail(selectedSku)
      } finally {
        this.hideLoading()
      }
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSku = null
      this.dialogSearchKeyword = ''
    },
    // 扫码相关方法
    async handleScan() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showError('当前浏览器不支持摄像头功能')
        return
      }

      if (!window.isSecureContext) {
        this.showError('请使用 HTTPS 协议访问本页面以启用摄像头功能')
        return
      }

      await this.startScanning()
    },
    async startScanning() {
      if (this.isScanning) return

      try {
        this.isScanning = true
        await this.$nextTick()

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        this.html5QrCode = new Html5Qrcode('scanner-video-container', { verbose: false })

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

        const cameraConfig = {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }

        if ('BarcodeDetector' in window) {
          console.log('浏览器支持原生BarcodeDetector API，性能最佳')
        }

        await this.html5QrCode.start(
          cameraConfig,
          config,
          async (decodedText) => {
            console.log('扫描到条码:', decodedText)
            await this.closeScannerOverlay()
            this.searchKeyword = decodedText
            this.handleSearch()
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
    }
  }
}
</script>

<style scoped>
/* 添加SKU按钮 */
.add-sku-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border-radius: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  flex-shrink: 0;
  color: #fff;
  font-size: 18px;
}

.add-sku-btn:active {
  transform: scale(0.95);
}

/* 列表卡片缩略图 */
.list-card-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
  flex-shrink: 0;
}

.list-card-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.list-card-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* SKU选择弹窗样式 */
.dialog-search-bar {
  margin-bottom: 15px;
}

.dialog-search-bar .search-input-wrapper {
  width: 100%;
}

.dialog-search-bar .search-input-wrapper input {
  width: 100%;
  height: 36px;
  padding: 0 30px 0 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
}

.dialog-search-bar .search-input-wrapper input:focus {
  border-color: #1890ff;
}

.dialog-search-bar .clear-btn {
  right: 8px;
}

.sku-options-list {
  max-height: 400px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sku-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.sku-option:last-child {
  border-bottom: none;
}

.sku-option:active {
  background: #f5f7fa;
}

.sku-option.selected {
  background: #e6f7ff;
}

.sku-option-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 12px;
  background: #f5f5f5;
  flex-shrink: 0;
}

.sku-option-info {
  flex: 1;
  overflow: hidden;
}

.sku-option-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-option-code {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.sku-check-icon {
  width: 24px;
  height: 24px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 10px;
}
</style>
