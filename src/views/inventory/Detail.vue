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
          <span :class="['status-badge', getStatusClass(detailData && detailData.stocktakeStatus)]">
            {{ getStatusText(detailData && detailData.stocktakeStatus) }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">采购单号</span>
            <span class="value">{{ detailData && detailData.purchaseNo || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">业务人员</span>
            <span class="value">{{ detailData && detailData.businessUserName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">采购方</span>
            <span class="value">{{ detailData && detailData.purchaseUserName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">运费</span>
            <span class="value">{{ detailData && detailData.shipFee}}</span>
          </div>
          <div class="info-row">
            <span class="label"><span class="required">*</span>货位</span>
            <el-select
              v-model="selectedGoodsLocationId"
              placeholder="请选择货位"
              size="small"
              class="goods-location-select"
              filterable
              clearable
            >
              <el-option
                v-for="item in goodsLocationList"
                :key="item.id"
                :label="item.goodsNumber"
                :value="item.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 图片上传区域 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">盘点图片（最多5张）</span>
          <span class="image-count">{{ uploadedImages.length }}/5</span>
        </div>
        <div class="card-body">
          <div class="image-upload-wrapper">
            <!-- 已上传的图片列表 -->
            <div v-if="uploadedImages.length > 0" class="image-list">
              <div
                v-for="(url, index) in uploadedImages"
                :key="index"
                class="preview-image-item"
              >
                <img :src="url" alt="盘点图片" @click="previewImage(index)" />
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  size="mini"
                  class="remove-image-btn"
                  @click="removeImage(index)"
                ></el-button>
              </div>
              <!-- 上传按钮（未达到5张时显示） -->
              <div v-if="uploadedImages.length < 5" class="upload-btn-small" @click="triggerUpload">
                <i class="el-icon-plus"></i>
              </div>
            </div>
            <!-- 初始上传按钮（没有图片时显示） -->
            <div v-else class="upload-btn" @click="triggerUpload">
              <i class="el-icon-camera"></i>
              <span>点击上传图片</span>
            </div>
            <!-- 隐藏的文件输入框 -->
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              @change="handleFileChange"
              style="display: none"
            />
          </div>
        </div>
      </div>

      <!-- 商品列表标题 -->
      <div class="section-title">
        <div class="section-title-left">
          <span>商品明细</span>
          <span class="item-count">共{{ filteredItems.length }}件</span>
        </div>
        <div class="hide-completed-switch" @click="hideStocktaked = !hideStocktaked">
          <span class="switch-label">隐藏已盘点</span>
          <span :class="['switch-btn', { active: hideStocktaked }]">
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
            :src="getThumbImage(item.mainImage)"
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
              <span class="quantity-value warning">{{ item.pendingNum || 0 }}</span>
            </div>
            <div class="quantity-row">
              <span class="quantity-label">异常数:</span>
              <span :class="['quantity-value', (item.abnormalNum || 0) > 0 ? 'danger' : '']">
                {{ item.abnormalNum || 0 }}
              </span>
            </div>
          </div>
          <div class="item-inventory-input" style="margin-top:10px">
            <div class="inventory-input-group">
              <label style="margin-right:5px">本次盘点:</label>
              <el-input-number
                v-model="inventoryInputs[getOriginalIndex(item)].stocktakeNum"
                :min="0"
                :max="item.num || 0"
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

      <!-- 底部操作按钮 -->
      <div class="bottom-action">
        <el-button class="action-btn reset-btn" @click="handleReset">
          重置
        </el-button>
        <el-button type="primary" class="action-btn submit-btn" @click="handleSubmit">
          提交盘点
        </el-button>
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
import { uploadInventoryImages, submitStockTake } from '../../api'
import ImagePreview from '../../components/ImagePreview.vue'

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
  name: 'InventoryDetail',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess', 'getGoodsLocationList'],
  data() {
    return {
      detailData: null,
      uploadedImages: [],
      previewVisible: false,
      previewImages: [],
      previewIndex: 0,
      hideStocktaked: false,
      inventoryInputs: [],
      selectedGoodsLocationId: null
    }
  },
  computed: {
    goodsLocationList() {
      return this.getGoodsLocationList()
    },
    filteredItems() {
      if (!this.detailData || !this.detailData.items) return []
      if (!this.hideStocktaked) return this.detailData.items
      return this.detailData.items.filter(item => {
        return !item.isStocktake
      })
    }
  },
  mounted() {
    const storedData = sessionStorage.getItem('inventoryDetailData')
    if (storedData) {
      this.detailData = JSON.parse(storedData)
      this.initInventoryInputs()

      // 如果列表数据中已有图片，初始化uploadedImages
      if (this.detailData.images && Array.isArray(this.detailData.images)) {
        this.uploadedImages = [...this.detailData.images]
      }

      // 货位选择逻辑：优先使用当前数据的货位，否则使用上次选择的货位
      if (this.detailData.goodsNumber) {
        // 如果当前数据有货位编号，尝试匹配货位ID
        const matchedLocation = this.goodsLocationList.find(
          item => item.goodsNumber === this.detailData.goodsNumber
        )
        if (matchedLocation) {
          this.selectedGoodsLocationId = matchedLocation.id
        }
      } else {
        // 如果当前数据没有货位，使用上次选择的货位
        const lastSelectedLocationId = localStorage.getItem('lastSelectedGoodsLocationId')
        if (lastSelectedLocationId) {
          this.selectedGoodsLocationId = lastSelectedLocationId
        }
      }
    }
  },
  watch: {
    detailData() {
      this.initInventoryInputs()
    }
  },
  methods: {
    goBack() {
      this.$router.push('/inventory/list')
    },
    getStatusClass(value) {
      return STATUS_CLASS_MAP[value] || 'processing'
    },
    getStatusText(value) {
      return STATUS_TEXT_MAP[value]
    },
    initInventoryInputs() {
      if (this.detailData && this.detailData.items) {
        this.inventoryInputs = this.detailData.items.map(item => ({
          stocktakeNum: item.stocktakeNum || 0
        }))
      }
    },
    triggerUpload() {
      if (this.uploadedImages.length >= 5) {
        this.showError('最多只能上传5张图片')
        return
      }
      this.$refs.fileInput.click()
    },
    async handleFileChange(e) {
      const file = e.target.files[0]
      if (!file) return

      if (this.uploadedImages.length >= 5) {
        this.showError('最多只能上传5张图片')
        e.target.value = ''
        return
      }

      this.showLoading()
      try {
        const result = await uploadInventoryImages(file)
        const imageUrl = result[0]
        this.uploadedImages.push(imageUrl)
        this.showSuccess('图片上传成功')
      } catch (error) {
        console.error('图片上传失败:', error)
        this.showError('图片上传失败，请重试')
      } finally {
        this.hideLoading()
        e.target.value = ''
      }
    },
    removeImage(index) {
      this.uploadedImages.splice(index, 1)
    },
    previewImage(index) {
      this.previewImages = this.uploadedImages
      this.previewIndex = index
      this.previewVisible = true
    },
    openPreview(index) {
      if (this.detailData && this.detailData.items) {
        // 预览时使用原图（不带缩略图参数）
        this.previewImages = this.detailData.items.map(item => item.mainImage).filter(Boolean)
        this.previewIndex = index
        this.previewVisible = true
      }
    },
    getOriginalIndex(item) {
      if (!this.detailData || !this.detailData.items) return 0
      return this.detailData.items.findIndex(i => i.id === item.id)
    },
    getThumbImage(imageUrl) {
      if (!imageUrl) return ''
      // 添加缩略图参数
      return imageUrl + '?imageView2/w/75/h/75'
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    },
    handleReset() {
      this.uploadedImages = []
      this.initInventoryInputs()
      this.showSuccess('已重置')
    },
    async handleSubmit() {
      if (!this.detailData) {
        this.showError('没有采购单数据')
        return
      }

      if (!this.selectedGoodsLocationId) {
        this.showError('请选择货位')
        return
      }

      // 检查是否有填写盘点数量
      const hasStocktakeData = this.inventoryInputs.some(input => input.stocktakeNum > 0)
      if (!hasStocktakeData) {
        this.showError('请至少填写一件商品的盘点数量')
        return
      }

      this.showLoading()
      try {
        // 获取选中的货位信息
        const selectedLocation = this.goodsLocationList.find(item => item.id === this.selectedGoodsLocationId)

        // 构建商品盘点数据
        const items = []
        this.inventoryInputs.forEach((input, index) => {
          if (input.stocktakeNum > 0) {
            const item = this.detailData.items[index]
            items.push({
              stocktakeNum: input.stocktakeNum,
              id: item.id || ''
            })
          }
        })

        const params = {
          goodsLocationId: this.selectedGoodsLocationId || '',
          goodsNumber: selectedLocation ? selectedLocation.goodsNumber : '',
          images: this.uploadedImages || [],
          items: items,
          id: this.detailData.id || ''
        }

        await submitStockTake(params)

        // 保存本次选择的货位ID，供下次使用
        if (this.selectedGoodsLocationId) {
          localStorage.setItem('lastSelectedGoodsLocationId', this.selectedGoodsLocationId)
        }

        this.showSuccess('提交盘点成功')
        this.hideLoading()
        // 返回列表页
        this.$router.push('/inventory/list')
      } catch (error) {
        console.error('提交盘点失败:', error)
        this.showError(error.message || '提交盘点失败，请重试')
        this.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
.result-container {
  padding-bottom: 80px;
}

/* 图片上传区域 */
.image-upload-wrapper {
  min-height: 100px;
}

.image-count {
  font-size: 12px;
  color: #909399;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-image-item {
  position: relative;
  width: calc((100% - 20px) / 3);
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #dcdfe6;
}

.preview-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

.upload-btn-small {
  width: calc((100% - 20px) / 3);
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-btn-small:hover,
.upload-btn-small:active {
  border-color: #409eff;
  background: #ecf5ff;
}

.upload-btn-small i {
  font-size: 24px;
  color: #409eff;
}

.upload-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 15px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-btn:hover,
.upload-btn:active {
  border-color: #409eff;
  background: #ecf5ff;
}

.upload-btn i {
  font-size: 36px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-btn span {
  font-size: 14px;
  color: #606266;
}

/* 底部操作按钮 */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 15px;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  z-index: 1000;
}


.action-btn {
  flex: 1;
  height: 46px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  letter-spacing: 2px;
}

.reset-btn {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.submit-btn {
  background: #409eff;
  border-color: #409eff;
}
</style>
