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
          placeholder="输入SKU、商品名称或货位号搜索"
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
          <div class="list-info-row">
            <span>
              <span class="list-label">SKU：</span>
              <span class="list-value">{{ item.sku || '-' }}</span>
            </span>
            <span v-if="item.goodsNumber">
              <span class="list-label">货位号：</span>
              <span class="list-value">{{ item.goodsNumber }}</span>
            </span>
            <span>
              <span class="list-label">盘点数量：</span>
              <span class="list-value" style="color: #1890ff; font-weight: 500;">{{ item.stocktakeNum || 0 }}</span>
            </span>
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

    <!-- SKU选择弹窗（多选） -->
    <el-dialog
      title="选择SKU（可多选）"
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
            placeholder="输入SKU、商品名称或货位号搜索"
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
      <div class="selected-count" v-if="tempSelectedSkus.length > 0">
        已选择 {{ tempSelectedSkus.length }} 个SKU
      </div>
      <div class="sku-options-list" ref="skuOptionsList" @scroll="handleSkuListScroll">
        <div
          v-for="sku in skuList"
          :key="sku.id"
          class="sku-option"
          :class="{ selected: isSkuSelected(sku) }"
          @click="toggleSkuSelection(sku)"
        >
          <el-checkbox :value="isSkuSelected(sku)" @click.native.stop></el-checkbox>
          <img
            class="sku-option-image"
            :src="getThumbImage(sku.mainImage)"
            referrerpolicy="no-referrer"
            @error="handleImageError"
          />
          <div class="sku-option-info">
            <div class="sku-option-name">{{ sku.productName || '-' }}</div>
            <div class="sku-option-code">SKU: {{ sku.sku || '-' }}</div>
            <div v-if="sku.goodsNumber" class="sku-option-code">货位号: {{ sku.goodsNumber }}</div>
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
        <el-button type="primary" @click="confirmSkuSelection">确定 ({{ tempSelectedSkus.length }})</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getCommodityStockTake } from '../../api'
import { scanAll } from '../../utils/scanner'

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
      tempSelectedSkus: [], // 改为数组支持多选
      skuCurrentPage: 1,
      skuTotalCount: 0,
      hasMoreSku: true,
      isLoadingMoreSku: false,
      dialogSearchTimer: null,
      searchDebounceTimer: null
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
    // 点击列表项进入详情（单条）
    goToDetail(item) {
      sessionStorage.setItem('noPurchaseOrderSkuList', JSON.stringify([item]))
      this.$router.push('/inventory/no-purchase-order-detail')
    },
    // 多选后进入详情
    goToDetailWithMultiple(items) {
      sessionStorage.setItem('noPurchaseOrderSkuList', JSON.stringify(items))
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
      this.tempSelectedSkus = []
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
          isStocktake: false,
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
    // 检查SKU是否已选中
    isSkuSelected(sku) {
      return this.tempSelectedSkus.some(s => s.id === sku.id)
    },
    // 切换SKU选择状态
    toggleSkuSelection(sku) {
      const index = this.tempSelectedSkus.findIndex(s => s.id === sku.id)
      if (index > -1) {
        this.tempSelectedSkus.splice(index, 1)
      } else {
        this.tempSelectedSkus.push({ ...sku })
      }
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
          isStocktake: false,
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
          isStocktake: false,
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
    confirmSkuSelection() {
      if (this.tempSelectedSkus.length === 0) {
        this.showError('请至少选择一个SKU')
        return
      }

      // 先保存选中的数据，再关闭弹窗（closeSkuSelector会清空tempSelectedSkus）
      const selectedItems = [...this.tempSelectedSkus]
      this.closeSkuSelector()
      this.goToDetailWithMultiple(selectedItems)
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSkus = []
      this.dialogSearchKeyword = ''
    },
    // 扫码相关方法
    async handleScan() {
      try {
        const result = await scanAll()
        if (result) {
          this.searchKeyword = result
          await this.handleScanSearch(result)
        }
      } catch (error) {
        this.showError(error.message || '扫码失败，请重试')
      }
    },
    // 扫码搜索 - isStocktake 传 null
    async handleScanSearch(keyword) {
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
            content: keyword || ''
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: PAGE_SIZE
        }

        const result = await getCommodityStockTake(params)
        this.totalCount = result.totalCount || 0
        this.listData = result.items || []
        this.hasMoreData = this.listData.length < this.totalCount
        this.currentPage = 2
      } catch (error) {
        console.error('扫码搜索失败:', error)
        this.showError('搜索失败，请重试')
      } finally {
        this.hideLoading()
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
  margin-bottom: 10px;
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

.selected-count {
  font-size: 13px;
  color: #409eff;
  margin-bottom: 10px;
  padding: 6px 12px;
  background: #ecf5ff;
  border-radius: 4px;
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
  gap: 10px;
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
</style>
