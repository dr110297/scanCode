<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>打包列表</h1>
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
    </div>

    <!-- 列表容器 -->
    <div class="list-container" ref="listContainer" @scroll="handleScroll">
      <div class="list-content">
        <div
          v-for="item in listData"
          :key="item.id"
          class="list-card"
        >
          <!-- 第一行：发货计划单号 + 状态 -->
          <div class="list-card-header">
            <div class="header-left">
              <span class="purchase-no">{{ item.shipPlanNo || '-' }}</span>
              <span :class="['status-badge', getStatusClass(item.planStatus)]">
                {{ getStatusText(item.planStatus) }}
              </span>
            </div>
            <button class="arrival-btn-small" @click="handleConfirmPacking(item)">确认打包</button>
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
        <p>暂无打包数据</p>
      </div>
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
import { getDesignatedStatusData } from '../../api'
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
  name: 'PackingList',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError'],
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
      previewIndex: 0
    }
  },
  mounted() {
    this.checkRefreshAndLoad()
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if (from.path === '/packing/detail') {
        vm.checkRefreshAndLoad()
      }
    })
  },
  beforeDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer)
    }
  },
  methods: {
    checkRefreshAndLoad() {
      if (sessionStorage.getItem('refreshPackingList') === 'true') {
        sessionStorage.removeItem('refreshPackingList')
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
          planStatus: [2],
          platforms: [],
          accountSiteIds: [],
          countrys: [],
          logisticTransportIds: [],
          isSelfProduced: null,
          hasExtraFee: null,
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
    openPreview(items, index) {
      this.previewImages = items.map(item => item.mainImage).filter(Boolean)
      this.previewIndex = index
      this.previewVisible = true
    },
    handleConfirmPacking(item) {
      // 跳转到箱规列表页面，传递当前数据
      this.$router.push({
        path: '/packing/box-list',
        query: { id: item.id }
      })
      // 将当前数据存储到sessionStorage
      sessionStorage.setItem('packingItem', JSON.stringify(item))
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    }
  }
}
</script>
