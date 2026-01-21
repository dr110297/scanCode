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
          <span class="card-title">基本信息</span>
          <span :class="['status-badge', getStatusClass(detailData && detailData.status && detailData.status.value)]">
            {{ detailData && detailData.statusDesc || '' }}
          </span>
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
        <span>商品明细</span>
        <span class="item-count">共{{ detailData && detailData.items && detailData.items.length || 0 }}件</span>
      </div>

      <!-- 每个商品独立卡片 -->
      <div
        v-for="(item, index) in (detailData && detailData.items || [])"
        :key="item.id"
        class="card item-card"
      >
        <div class="item-card-header">
          <img
            class="item-image"
            :src="item.mainImage"
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
              <span class="quantity-label">采购数量:</span>
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
              <div class="number-input">
                <button type="button" class="num-btn minus" @click="decreaseArrival(index)">-</button>
                <input
                  type="number"
                  class="arrival-num-input"
                  v-model.number="arrivalInputs[index].arrivalNum"
                  :min="0"
                  :max="(item.num || 0) - (item.arrivalNum || 0)"
                />
                <button type="button" class="num-btn plus" @click="increaseArrival(index, item)">+</button>
              </div>
            </div>
            <div class="arrival-input-group">
              <label>异常数量:</label>
              <div class="number-input">
                <button type="button" class="num-btn" @click="decreaseAbnormal(index)">-</button>
                <input
                  type="number"
                  class="abnormal-num-input"
                  v-model.number="arrivalInputs[index].abnormalNum"
                  :min="0"
                />
                <button type="button" class="num-btn" @click="increaseAbnormal(index)">+</button>
              </div>
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
  </div>
</template>

<script>
import { fbaPurchaseArrival } from '../../api'

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
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      detailData: null,
      previousPage: 'arrival-list',
      arrivalInputs: []
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
    decreaseArrival(index) {
      if (this.arrivalInputs[index].arrivalNum > 0) {
        this.arrivalInputs[index].arrivalNum--
      }
    },
    increaseArrival(index, item) {
      const max = (item.num || 0) - (item.arrivalNum || 0)
      if (this.arrivalInputs[index].arrivalNum < max) {
        this.arrivalInputs[index].arrivalNum++
      }
    },
    decreaseAbnormal(index) {
      if (this.arrivalInputs[index].abnormalNum > 0) {
        this.arrivalInputs[index].abnormalNum--
      }
    },
    increaseAbnormal(index) {
      this.arrivalInputs[index].abnormalNum++
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
    }
  }
}
</script>
