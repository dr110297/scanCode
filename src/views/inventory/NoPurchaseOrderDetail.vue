<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>无采购单盘点详情</h1>
    </div>

    <div class="result-container">
      <!-- 基本信息 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">基本信息</span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label"><span class="required">*</span>货位</span>
            <el-select
              v-model="selectedGoodsLocationId"
              placeholder="请选择货位"
              size="small"
              class="goods-location-select"
              filterable
              clearable
              @change="handleGoodsLocationChange"
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
                <img :src="getUploadThumbImage(url)" alt="盘点图片" @click="previewImage(index)" />
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

      <!-- 商品明细 -->
      <div class="section-title">
        <div class="section-title-left">
          <span>商品明细</span>
        </div>
      </div>

      <!-- 商品卡片 -->
      <div v-if="skuData" class="card item-card">
        <div class="item-card-header">
          <img
            class="item-image"
            :src="getThumbImage(skuData.mainImage)"
            referrerpolicy="no-referrer"
            @click="openSkuImagePreview"
            @error="handleImageError"
          />
          <div class="item-basic-info">
            <div class="item-name">{{ skuData.productName || '-' }}</div>
            <div class="item-sku">SKU: {{ skuData.sku || '-' }}</div>
            <div v-if="skuData.goodsNumber" class="item-sku">货号: {{ skuData.goodsNumber }}</div>
          </div>
        </div>
        <div class="item-info">
          <div class="item-inventory-input">
            <div class="inventory-input-group">
              <label>本次盘点:</label>
              <el-input-number
                v-model="stocktakeNum"
                :min="0"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-action">
        <el-button class="action-btn reset-btn" @click="handleClear">
          清空
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
import { commoditySubmitStockTake, uploadInventoryImages } from '../../api'
import ImagePreview from '../../components/ImagePreview.vue'

export default {
  name: 'NoPurchaseOrderDetail',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess', 'getGoodsLocationList'],
  data() {
    return {
      skuData: null,
      uploadedImages: [],
      stocktakeNum: 0,
      lastStocktakeNum: 0,
      selectedGoodsLocationId: null,
      previewVisible: false,
      previewImages: [],
      previewIndex: 0
    }
  },
  computed: {
    goodsLocationList() {
      return this.getGoodsLocationList()
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    initData() {
      // 从 sessionStorage 获取 SKU 数据
      const skuDataStr = sessionStorage.getItem('noPurchaseOrderSkuData')
      if (skuDataStr) {
        this.skuData = JSON.parse(skuDataStr)
        // 保存原始的盘点数量
        this.lastStocktakeNum = this.skuData.stocktakeNum || 0
        this.stocktakeNum = this.lastStocktakeNum

        // 如果当前数据的 stocktakeNum 为 0 或空，使用上次提交缓存的值
        if (!this.stocktakeNum || this.stocktakeNum === 0) {
          const cachedStocktakeNum = localStorage.getItem('lastSubmittedStocktakeNum')
          if (cachedStocktakeNum) {
            this.stocktakeNum = parseInt(cachedStocktakeNum, 10) || 0
          }
        }
      }

      // 货位选择逻辑：使用上次选择的货位
      const lastSelectedLocationId = localStorage.getItem('lastSelectedGoodsLocationId')
      if (lastSelectedLocationId) {
        this.selectedGoodsLocationId = lastSelectedLocationId
      }
    },
    goBack() {
      this.$router.push('/inventory/no-purchase-order')
    },
    handleGoodsLocationChange() {
      // 当选择货位时，如果盘点数量为0或无值，使用上次的数量
      if (this.selectedGoodsLocationId && (this.stocktakeNum === 0 || !this.stocktakeNum)) {
        if (this.lastStocktakeNum > 0) {
          this.stocktakeNum = this.lastStocktakeNum
        }
      }
    },
    getThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?imageView2/w/75/h/75'
    },
    getUploadThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?x-oss-process=image/resize,m_pad,w_150,h_150,limit_0'
    },
    openSkuImagePreview() {
      if (this.skuData && this.skuData.mainImage) {
        this.previewImages = [this.skuData.mainImage]
        this.previewIndex = 0
        this.previewVisible = true
      }
    },
    handleClear() {
      this.stocktakeNum = 0
      this.uploadedImages = []
    },
    async handleSubmit() {
      if (!this.skuData) {
        this.showError('SKU数据异常')
        return
      }

      if (!this.selectedGoodsLocationId) {
        this.showError('请选择货位')
        return
      }

      if (!this.stocktakeNum || this.stocktakeNum <= 0) {
        this.showError('请填写盘点数量')
        return
      }

      this.showLoading()
      try {
        const selectedLocation = this.goodsLocationList.find(item => item.id === this.selectedGoodsLocationId)

        const params = {
          goodsLocationId: this.selectedGoodsLocationId || '',
          goodsNumber: selectedLocation ? selectedLocation.goodsNumber : '',
          images: this.uploadedImages || [],
          stocktakeNum: this.stocktakeNum,
          id: this.skuData.id || ''
        }

        await commoditySubmitStockTake(params)

        // 保存本次选择的货位ID，供下次使用
        if (this.selectedGoodsLocationId) {
          localStorage.setItem('lastSelectedGoodsLocationId', this.selectedGoodsLocationId)
        }

        // 保存本次提交的盘点数量，供下一条数据使用
        if (this.stocktakeNum > 0) {
          localStorage.setItem('lastSubmittedStocktakeNum', this.stocktakeNum.toString())
        }

        this.showSuccess('提交盘点成功')
        this.hideLoading()

        // 返回列表页
        this.goBack()
      } catch (error) {
        console.error('提交盘点失败:', error)
        this.showError(error.message || '提交盘点失败，请重试')
        this.hideLoading()
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
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    }
  }
}
</script>

<style scoped>
.result-container {
  padding-bottom: 80px;
}

.goods-location-select {
  width: 180px;
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

/* 盘点输入区域 */
.item-inventory-input {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e8e8e8;
}

.inventory-input-group {
  display: flex;
  align-items: center;
}

.inventory-input-group label {
  font-size: 13px;
  color: #666;
  margin-right: 10px;
  flex-shrink: 0;
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
