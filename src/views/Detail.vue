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
          <span :class="['status-badge', getStatusClass(detailData?.status?.value)]">
            {{ detailData?.status?.name || '' }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">采购单号</span>
            <span class="value">{{ detailData?.purchaseNo || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">归属人</span>
            <span class="value">{{ detailData?.belongsUserName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">采购方</span>
            <span class="value">{{ detailData?.purchaserName || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 商品���表 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">商品明细</span>
          <span class="item-count">共{{ detailData?.items?.length || 0 }}件</span>
        </div>
        <div class="items-list">
          <div
            v-for="(item, index) in detailData?.items"
            :key="item.id"
            class="item-card"
          >
            <div class="item-card-header">
              <img
                class="item-image"
                :src="item.mainImage || defaultImage"
                :alt="item.productName || '商品图片'"
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

          <div v-if="!detailData?.items?.length" class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>暂无商品信息</p>
          </div>
        </div>
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
import { ref, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fbaPurchaseArrival } from '../api'

export default {
  name: 'Detail',
  setup() {
    const router = useRouter()
    const showLoading = inject('showLoading')
    const hideLoading = inject('hideLoading')
    const showError = inject('showError')
    const showSuccess = inject('showSuccess')

    const detailData = ref(null)
    const previousPage = ref('list')
    const arrivalInputs = ref([])

    const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23ccc' font-size='12'%3E暂无图片%3C/text%3E%3C/svg%3E"

    const goBack = () => {
      if (previousPage.value === 'list') {
        router.push('/list')
      } else {
        router.push('/')
      }
    }

    const getStatusClass = (value) => {
      switch (value) {
        case 0: return 'pending'
        case 1: return 'processing'
        case 2: return 'completed'
        case 3: return 'cancelled'
        default: return 'processing'
      }
    }

    const handleImageError = (event) => {
      event.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23ccc' font-size='12'%3E加载失败%3C/text%3E%3C/svg%3E"
    }

    const initArrivalInputs = () => {
      if (detailData.value?.items) {
        arrivalInputs.value = detailData.value.items.map(() => ({
          arrivalNum: 0,
          abnormalNum: 0
        }))
      }
    }

    const decreaseArrival = (index) => {
      if (arrivalInputs.value[index].arrivalNum > 0) {
        arrivalInputs.value[index].arrivalNum--
      }
    }

    const increaseArrival = (index, item) => {
      const max = (item.num || 0) - (item.arrivalNum || 0)
      if (arrivalInputs.value[index].arrivalNum < max) {
        arrivalInputs.value[index].arrivalNum++
      }
    }

    const decreaseAbnormal = (index) => {
      if (arrivalInputs.value[index].abnormalNum > 0) {
        arrivalInputs.value[index].abnormalNum--
      }
    }

    const increaseAbnormal = (index) => {
      arrivalInputs.value[index].abnormalNum++
    }

    const handleConfirmArrival = async () => {
      if (!detailData.value) {
        showError('没有采购单数据')
        return
      }

      const arrivalItems = []

      arrivalInputs.value.forEach((input, index) => {
        if (input.arrivalNum > 0 || input.abnormalNum > 0) {
          const item = detailData.value.items[index]
          arrivalItems.push({
            itemId: item.id || '',
            sku: item.sku || '',
            arrivalNum: input.arrivalNum,
            arrivalRemark: '',
            abnormalNum: input.abnormalNum,
            arrivalType: {},
            isCompleted: input.arrivalNum >= ((item.num || 0) - (item.arrivalNum || 0))
          })
        }
      })

      if (arrivalItems.length === 0) {
        showError('请填写至少一件商品的到货数量')
        return
      }

      showLoading()

      try {
        const params = {
          purchaseId: detailData.value.id || detailData.value.purchaseNo || '',
          wareHouseId: detailData.value.warehouseId || '',
          arrivalTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          items: arrivalItems
        }

        await fbaPurchaseArrival(params)
        showSuccess('到货确认成功')

        // 清空输入
        arrivalInputs.value = arrivalInputs.value.map(() => ({
          arrivalNum: 0,
          abnormalNum: 0
        }))
      } catch (error) {
        showError('到货确认失败，请重试')
        console.error('到货确认错误:', error)
      } finally {
        hideLoading()
      }
    }

    onMounted(() => {
      const storedData = sessionStorage.getItem('detailData')
      const storedPreviousPage = sessionStorage.getItem('previousPage')

      if (storedData) {
        detailData.value = JSON.parse(storedData)
        initArrivalInputs()
      }

      if (storedPreviousPage) {
        previousPage.value = storedPreviousPage
      }
    })

    watch(detailData, () => {
      initArrivalInputs()
    })

    return {
      detailData,
      arrivalInputs,
      defaultImage,
      goBack,
      getStatusClass,
      handleImageError,
      decreaseArrival,
      increaseArrival,
      decreaseAbnormal,
      increaseAbnormal,
      handleConfirmArrival
    }
  }
}
</script>
