<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>有采购单盘点</h1>
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
          @click="goToDetail(item)"
        >
          <!-- 第一行：采购单号 + 状态 -->
          <div class="list-card-header">
            <div class="purchase-no">{{ item.purchaseNo || '-' }}</div>
            <div :class="['status-badge', getStatusClass(item.stocktakeStatus)]">
              {{ getStatusText(item.stocktakeStatus) }}
            </div>
          </div>
          <!-- 第二行：业务人员和采购方 -->
          <div class="list-card-info">
            <span class="info-item">业务人员：{{ item.businessUserName || '-' }}</span>
            <span class="info-item">采购方：{{ item.purchaseUserName || '-' }}</span>
          </div>
          <!-- 第三行：商品数量和运费 -->
          <div class="list-card-info">
            <span class="info-item">商品数量：{{ item.productNum || 0 }}</span>
            <span class="info-item">运费：{{ item.shipFee || 0 }}</span>
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
  </div>
</template>

<script>
import { getPurchaseOrderStockTake } from '../../api'
import { scanAll } from '../../utils/scanner'

// 状态枚举
const STATUS_CLASS_MAP = {
  0: 'pending',
  1: 'processing',
  2: 'completed',
}

const STATUS_TEXT_MAP = {
  0: '待盘点',
  1: '部分盘点',
  2: '全部盘点',
}

export default {
  name: 'InventoryList',
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      PAGE_SIZE: 25,
      listData: [],
      currentPage: 1,
      totalCount: 0,
      isLoadingMore: false,
      hasMoreData: true,
      searchKeyword: '',
      searchDebounceTimer: null
    }
  },
  mounted() {
    this.loadListData()
  },
  beforeDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  methods: {
    goBack() {
      this.$router.push('/inventory/index')
    },
    getStatusClass(value) {
      return STATUS_CLASS_MAP[value] || 'processing'
    },
    getStatusText(value) {
      return STATUS_TEXT_MAP[value]
    },
    async loadListData(isLoadMore = false) {
      if (this.isLoadingMore || (!this.hasMoreData && isLoadMore)) return

      this.isLoadingMore = true
      if (!isLoadMore) this.showLoading()

      try {
        const params = {
          shopIds: [],
          arrivalStatus: [],
          requisitionStatus: [],
          stocktakeStatus: [1,2],
          paidStatus: [],
          businessUserIds: [],
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
          maxResultCount: this.PAGE_SIZE
        }

        const result = await getPurchaseOrderStockTake(params)
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
      sessionStorage.setItem('inventoryDetailData', JSON.stringify(item))
      this.$router.push({
        path: '/inventory/detail',
        query: { purchaseNo: item.purchaseNo }
      })
    },
    async handleScanResult(decodedText) {
      this.showLoading()
      try {
        const params = {
          shopIds: [],
          arrivalStatus: [],
          requisitionStatus: [],
          stocktakeStatus: null,
          paidStatus: [],
          businessUserIds: [],
          timeSearches: {
            searchType: 0,
            beginTime: '',
            endTime: ''
          },
          contentSearches: {
            searchType: 0,
            content: decodedText
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: 25
        }

        const result = await getPurchaseOrderStockTake(params)
        const items = result.items || []

        if (items.length === 1) {
          // 找到唯一匹配项，直接进入详情页
          this.goToDetail(items[0])
        } else if (items.length > 1) {
          // 多个匹配项，显示在列表中
          this.searchKeyword = decodedText
          this.listData = items
          this.totalCount = result.totalCount || 0
          this.hasMoreData = this.listData.length < this.totalCount
          this.currentPage = 2
          this.showSuccess(`找到${items.length}条匹配数据，请选择`)
        } else {
          // 没有找到匹配项
          this.showError('未找到匹配的采购单')
        }
      } catch (error) {
        console.error('扫码搜索失败:', error)
        this.showError(error.message || '搜索失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
    async handleScan() {
      try {
        const result = await scanAll()
        if (result) {
          await this.handleScanResult(result)
        }
      } catch (error) {
        this.showError(error.message || '扫码失败，请重试')
      }
    }
  }
}
</script>
