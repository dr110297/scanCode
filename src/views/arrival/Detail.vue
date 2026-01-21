<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>采购单详情</h1>
    </div>

    <div class="result-container">
      <!-- 基本信息卡片 -->
      <div class="card">
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">基本信息</span>
            <span :class="['status-badge', getStatusClass(detailData && detailData.status && detailData.status.value)]">
              {{ detailData && detailData.statusDesc || '' }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">采购单号</span>
            <span class="value">{{ detailData && detailData.purchaseNo || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">业务人员</span>
            <span class="value">{{ detailData && detailData.belongsUserName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">采购方</span>
            <span class="value">{{ detailData && detailData.purchaserName || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 商品列表标题 -->
      <div class="section-title">
        <div class="section-title-left">
          <span>商品明细</span>
          <span class="item-count">共{{ filteredItems.length }}件</span>
        </div>
        <div class="hide-completed-switch" @click="hideCompleted = !hideCompleted">
          <span class="switch-label">隐藏已到货</span>
          <span :class="['switch-btn', { active: hideCompleted }]">
            <span class="switch-dot"></span>
          </span>
        </div>
      </div>

      <!-- 每个商品独立卡片 -->
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="card item-card"
      >
        <div class="item-card-header">
          <img
            class="item-image"
            :src="item.mainImage"
            referrerpolicy="no-referrer"
            @click="openPreview(getOriginalIndex(item))"
            @error="handleImageError"
          />
          <div class="item-basic-info">
            <div class="item-name">{{ item.productName || '-' }}</div>
            <div class="item-sku">SKU: {{ item.sku || '-' }}</div>
            <div v-if="item.fnsku" class="item-sku">FNSKU: {{ item.fnsku }}</div>
            <div v-if="item.shopName" class="item-sku">店铺: {{ item.shopName }}</div>
          </div>
        </div>
        <div class="item-info">
          <div class="item-quantity-info">
            <div class="quantity-row">
              <span class="quantity-label">采购量:</span>
              <span class="quantity-value">{{ item.num || 0 }}</span>
            </div>
            <div class="quantity-row">
              <span class="quantity-label">已到货:</span>
              <span class="quantity-value success">{{ item.arrivalNum || 0 }}</span>
            </div>
            <div class="quantity-row">
              <span class="quantity-label">待收货:</span>
              <span class="quantity-value warning">{{ (item.num || 0) - (item.arrivalNum || 0) }}</span>
            </div>
            <div class="quantity-row">
              <span class="quantity-label">异常数:</span>
              <span :class="['quantity-value', (item.abnormalNum || 0) > 0 ? 'danger' : '']">
                {{ item.abnormalNum || 0 }}
              </span>
            </div>
          </div>
          <div class="item-arrival-input">
            <div class="arrival-input-group">
              <label>本次到货:</label>
              <el-input-number
                v-model="arrivalInputs[getOriginalIndex(item)].arrivalNum"
                :min="0"
                :max="(item.num || 0) - (item.arrivalNum || 0)"
                size="small"
              />
            </div>
            <div class="arrival-input-group">
              <label>异常数量:</label>
              <el-input-number
                v-model="arrivalInputs[getOriginalIndex(item)].abnormalNum"
                :min="0"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!detailData || !detailData.items || !detailData.items.length" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>暂无商品信息</p>
      </div>

      <!-- 到货操作区域 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">到货操作</span>
        </div>
        <div class="card-body">
          <div class="arrival-info">
            <p class="arrival-tip">请在上方商品列表中填写各商品的到货数量，然后点击确认到货</p>
          </div>
          <button class="arrival-btn" @click="handleConfirmArrival">
            <span class="arrival-icon"></span>
            确认到货
          </button>
        </div>
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
import { fbaPurchaseArrival } from '../../api'
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
  name: 'ArrivalDetail',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      detailData: null,
      previousPage: 'arrival-list',
      arrivalInputs: [],
      previewVisible: false,
      previewImages: [],
      previewIndex: 0,
      hideCompleted: false
    }
  },
  computed: {
    filteredItems() {
      if (!this.detailData || !this.detailData.items) return []
      if (!this.hideCompleted) return this.detailData.items
      return this.detailData.items.filter(item => {
        const num = item.num || 0
        const arrivalNum = item.arrivalNum || 0
        return arrivalNum < num
      })
    }
  },
  mounted() {
    const storedData = sessionStorage.getItem('detailData')
    const storedPreviousPage = sessionStorage.getItem('previousPage')

    if (storedData) {
      this.detailData = JSON.parse(storedData)
      this.initArrivalInputs()
    }

    if (storedPreviousPage) {
      this.previousPage = storedPreviousPage
    }
  },
  watch: {
    detailData() {
      this.initArrivalInputs()
    }
  },
  methods: {
    goBack() {
      if (this.previousPage === 'arrival-list') {
        this.$router.push('/arrival/list')
      } else {
        this.$router.push('/')
      }
    },
    getStatusClass(value) {
      return STATUS_CLASS_MAP[value] || 'processing'
    },
    initArrivalInputs() {
      if (this.detailData && this.detailData.items) {
        this.arrivalInputs = this.detailData.items.map(() => ({
          arrivalNum: 0,
          abnormalNum: 0
        }))
      }
    },
    async handleConfirmArrival() {
      if (!this.detailData) {
        this.showError('没有采购单数据')
        return
      }

      const arrivalItems = []

      this.arrivalInputs.forEach((input, index) => {
        if (input.arrivalNum > 0 || input.abnormalNum > 0) {
          const item = this.detailData.items[index]
          arrivalItems.push({
            itemId: item.id || '',
            sku: item.sku || '',
            arrivalNum: input.arrivalNum,
            arrivalRemark: '',
            abnormalNum: input.abnormalNum,
            arrivalType: null,
            isCompleted: input.arrivalNum >= ((item.num || 0) - (item.arrivalNum || 0))
          })
        }
      })

      if (arrivalItems.length === 0) {
        this.showError('请填写至少一件商品的到货数量')
        return
      }

      this.showLoading()
      const params = {
        purchaseId: this.detailData.id || this.detailData.purchaseNo || '',
        wareHouseId: this.detailData.warehouseId || '',
        arrivalTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        items: arrivalItems
      }

      fbaPurchaseArrival(params).then(res => {
        console.log('到货确认成功:', res)
        this.showSuccess(res.message || '到货确认成功')
        this.hideLoading()
        // 返回列表页并刷新
        sessionStorage.setItem('refreshList', 'true')
        this.$router.push('/arrival/list')
      }).catch(error => {
        console.error('到货确认失败:', error)
        this.showError(error.message || '到货确认失败，请重试')
        this.hideLoading()
      })
    },
    openPreview(index) {
      if (this.detailData && this.detailData.items) {
        this.previewImages = this.detailData.items.map(item => item.mainImage).filter(Boolean)
        this.previewIndex = index
        this.previewVisible = true
      }
    },
    getOriginalIndex(item) {
      if (!this.detailData || !this.detailData.items) return 0
      return this.detailData.items.findIndex(i => i.id === item.id)
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    }
  }
}
</script>
