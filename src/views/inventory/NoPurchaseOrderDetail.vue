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

      <!-- 盘点图片（所有SKU共用） -->
      <div class="card">
        <div class="card-header">
          <span class="card-title"><span class="required">*</span>盘点图片</span>
          <span class="image-count">{{ sharedImages.length }}/5</span>
        </div>
        <div class="card-body">
          <div class="image-upload-wrapper">
            <div v-if="sharedImages.length > 0" class="image-list">
              <div
                v-for="(url, imgIndex) in sharedImages"
                :key="imgIndex"
                class="preview-image-item"
              >
                <img :src="getUploadThumbImage(url)" alt="盘点图片" @click="previewSharedImage(imgIndex)" />
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  size="mini"
                  class="remove-image-btn"
                  @click="removeSharedImage(imgIndex)"
                ></el-button>
              </div>
              <div v-if="sharedImages.length < 5" class="upload-btn-small" @click="triggerSharedUpload">
                <i class="el-icon-plus"></i>
              </div>
            </div>
            <div v-else class="upload-btn" @click="triggerSharedUpload">
              <i class="el-icon-camera"></i>
              <span>点击上传图片</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作栏：扫码和添加SKU -->
      <div class="action-bar">
        <button class="scan-icon-btn" @click="handleScan">
          <span class="scan-icon"></span>
        </button>
        <button class="add-sku-btn" @click="openSkuSelector">
          <i class="el-icon-plus"></i>
          <span>添加SKU</span>
        </button>
        <span class="sku-count">已添加 {{ skuList.length }} 个SKU</span>
      </div>

      <!-- 商品明细列表 -->
      <div class="section-title">
        <div class="section-title-left">
          <span>商品明细</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="skuList.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>暂无SKU数据，请扫码或点击添加</p>
      </div>

      <!-- SKU卡片列表 -->
      <div v-for="(item, index) in skuList" :key="item.id || index" class="card item-card">
        <div class="item-card-header">
          <img
            class="item-image"
            :src="getThumbImage(item.mainImage)"
            referrerpolicy="no-referrer"
            @click="openSkuImagePreview(item)"
            @error="handleImageError"
          />
          <div class="item-basic-info">
            <div class="item-name">{{ item.productName || '-' }}</div>
            <div class="item-sku">SKU: {{ item.sku || '-' }}</div>
            <div v-if="item.goodsNumber" class="item-sku">货位号: {{ item.goodsNumber }}</div>
          </div>
          <el-button
            type="text"
            icon="el-icon-delete"
            class="delete-btn"
            @click="removeSku(index)"
          ></el-button>
        </div>

        <!-- 盘点数量 -->
        <div class="item-inventory-input">
          <div class="inventory-input-group">
            <label><span class="required">*</span>本次盘点:</label>
            <el-input-number
              v-model="item.stocktakeNum"
              :min="0"
              size="small"
            />
          </div>
          <div class="inventory-input-group" style="margin:10px 0 0 5px">
            <label>备注信息:</label>
            <el-input
              v-model="item.note"
              placeholder="请输入备注"
              type="textarea"
              size="small"
              style="flex:1"
            />
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

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      @change="handleFileChange"
      style="display: none"
    />

    <!-- SKU选择弹窗（多选） -->
    <el-dialog
      title="选择SKU（可多选）"
      :visible.sync="showSkuSelector"
      width="90%"
      :close-on-click-modal="false"
      custom-class="sku-dialog"
    >
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
          v-for="sku in dialogSkuList"
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
        <div v-if="isLoadingMoreSku" class="loading-more">
          <i class="el-icon-loading"></i>
          <span>加载中...</span>
        </div>
        <div v-if="!hasMoreSku && dialogSkuList.length > 0" class="no-more-data">
          <span>没有更多数据了</span>
        </div>
        <div v-if="dialogSkuList.length === 0 && !isLoadingMoreSku" class="empty-state">
          <p>{{ dialogSearchKeyword ? '未找到匹配的SKU' : '暂无可选SKU' }}</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeSkuSelector">取消</el-button>
        <el-button type="primary" @click="confirmSkuSelection">确定 ({{ tempSelectedSkus.length }})</el-button>
      </span>
    </el-dialog>

    <!-- 图片预览 -->
    <ImagePreview
      :visible.sync="previewVisible"
      :images="previewImages"
      :start-index="previewIndex"
    />
  </div>
</template>

<script>
import { getCommodityStockTake, commoditySubmitStockTake, uploadInventoryImages } from '../../api'
import { scanAll } from '../../utils/scanner'
import ImagePreview from '../../components/ImagePreview.vue'

const PAGE_SIZE = 25

export default {
  name: 'NoPurchaseOrderDetail',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess', 'getGoodsLocationList'],
  data() {
    return {
      skuList: [], // SKU列表，每项包含 id, sku, productName, mainImage, goodsNumber, stocktakeNum
      sharedImages: [], // 共用的盘点图片
      selectedGoodsLocationId: null,
      // 弹窗相关
      showSkuSelector: false,
      dialogSearchKeyword: '',
      dialogSkuList: [],
      tempSelectedSkus: [], // 改为数组支持多选
      skuCurrentPage: 1,
      skuTotalCount: 0,
      hasMoreSku: true,
      isLoadingMoreSku: false,
      dialogSearchTimer: null,
      // 图片预览
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
  beforeDestroy() {
    if (this.dialogSearchTimer) {
      clearTimeout(this.dialogSearchTimer)
    }
  },
  methods: {
    initData() {
      // 从 sessionStorage 获取 SKU 列表数据
      const skuListStr = sessionStorage.getItem('noPurchaseOrderSkuList')
      if (skuListStr) {
        const rawList = JSON.parse(skuListStr)
        // 初始化每条数据的 stocktakeNum 和 note
        this.skuList = rawList.map(item => ({
          ...item,
          stocktakeNum: item.stocktakeNum || 0,
          note: item.note || ''
        }))

        // 图片回显：从第一个有images的SKU中获取图片数据
        const firstSkuWithImages = rawList.find(item => item.images && Array.isArray(item.images) && item.images.length > 0)
        if (firstSkuWithImages) {
          this.sharedImages = [...firstSkuWithImages.images]
        }
      }

      // 货位选择逻辑
      const firstSkuWithLocation = this.skuList.find(item => item.goodsLocationId)
      if (firstSkuWithLocation) {
        this.selectedGoodsLocationId = firstSkuWithLocation.goodsLocationId
      } else {
        const lastSelectedLocationId = localStorage.getItem('lastSelectedGoodsLocationId')
        if (lastSelectedLocationId) {
          this.selectedGoodsLocationId = lastSelectedLocationId
        }
      }
    },
    goBack() {
      this.$router.push('/inventory/no-purchase-order')
    },
    getThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?imageView2/w/75/h/75'
    },
    getUploadThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?x-oss-process=image/resize,m_pad,w_150,h_150,limit_0'
    },
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
    },
    // 删除SKU
    removeSku(index) {
      this.skuList.splice(index, 1)
    },
    // 共用图片上传相关
    triggerSharedUpload() {
      if (this.sharedImages.length >= 5) {
        this.showError('最多只能上传5张图片')
        return
      }
      this.$refs.fileInput.click()
    },
    async handleFileChange(e) {
      const file = e.target.files[0]
      if (!file) return

      if (this.sharedImages.length >= 5) {
        this.showError('最多只能上传5张图片')
        e.target.value = ''
        return
      }

      this.showLoading()
      try {
        const result = await uploadInventoryImages(file)
        const imageUrl = result[0]
        this.sharedImages.push(imageUrl)
        this.showSuccess('图片上传成功')
      } catch (error) {
        console.error('图片上传失败:', error)
        this.showError('图片上传失败，请重试')
      } finally {
        this.hideLoading()
        e.target.value = ''
      }
    },
    removeSharedImage(imgIndex) {
      this.sharedImages.splice(imgIndex, 1)
    },
    // 图片预览
    openSkuImagePreview(item) {
      if (item && item.mainImage) {
        this.previewImages = [item.mainImage]
        this.previewIndex = 0
        this.previewVisible = true
      }
    },
    previewSharedImage(imgIndex) {
      this.previewImages = this.sharedImages
      this.previewIndex = imgIndex
      this.previewVisible = true
    },
    // 清空
    handleClear() {
      this.skuList.forEach(item => {
        item.stocktakeNum = 0
        item.note = ''
      })
      this.sharedImages = []
    },
    // 提交盘点
    async handleSubmit() {
      if (this.skuList.length === 0) {
        this.showError('请至少添加一个SKU')
        return
      }

      if (!this.selectedGoodsLocationId) {
        this.showError('请选择货位')
        return
      }

      // 验证共用图片
      if (this.sharedImages.length === 0) {
        this.showError('请上传盘点图片')
        return
      }

      // 验证每条数据的盘点数量
      for (let i = 0; i < this.skuList.length; i++) {
        const item = this.skuList[i]
        if (!item.stocktakeNum || item.stocktakeNum <= 0) {
          this.showError(`第${i + 1}条SKU（${item.sku}）请填写盘点数量`)
          return
        }
      }

      this.showLoading()
      try {
        const selectedLocation = this.goodsLocationList.find(item => item.id === this.selectedGoodsLocationId)
        const goodsNumber = selectedLocation ? selectedLocation.goodsNumber : ''

        // 构建数组格式的提交数据，所有SKU共用同一组图片
        const submitList = this.skuList.map(item => ({
          stocktakeNum: item.stocktakeNum,
          id: item.id || '',
          note: item.note || ''
        }))
        const params = {
          goodsLocationId: this.selectedGoodsLocationId || '',
          goodsNumber: goodsNumber,
          images: this.sharedImages,
          items:submitList
        }
        await commoditySubmitStockTake(params)

        // 保存本次选择的货位ID
        if (this.selectedGoodsLocationId) {
          localStorage.setItem('lastSelectedGoodsLocationId', this.selectedGoodsLocationId)
        }

        this.showSuccess('提交盘点成功')
        this.hideLoading()
        this.goBack()
      } catch (error) {
        console.error('提交盘点失败:', error)
        this.showError(error.message || '提交盘点失败，请重试')
        this.hideLoading()
      }
    },
    // 扫码添加SKU
    async handleScan() {
      try {
        const result = await scanAll()
        if (result) {
          await this.searchAndAddSku(result)
        }
      } catch (error) {
        this.showError(error.message || '扫码失败，请重试')
      }
    },
    async searchAndAddSku(keyword) {
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
          maxResultCount: 1
        }

        const result = await getCommodityStockTake(params)
        if (result && result.items && result.items.length > 0) {
          const sku = result.items[0]
          // 检查是否已存在
          const exists = this.skuList.some(item => item.id === sku.id)
          if (exists) {
            this.showError('该SKU已添加')
          } else {
            this.skuList.push({
              ...sku,
              stocktakeNum: sku.stocktakeNum || 0,
              note: sku.note || ''
            })
            this.showSuccess('添加成功')
          }
        } else {
          this.showError('未找到匹配的SKU')
        }
      } catch (error) {
        console.error('搜索SKU失败:', error)
        this.showError('搜索失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
    // SKU选择弹窗相关
    async openSkuSelector() {
      this.dialogSearchKeyword = ''
      this.tempSelectedSkus = []
      this.dialogSkuList = []
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
          this.dialogSkuList = result.items
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.dialogSkuList.length < this.skuTotalCount
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
          this.dialogSkuList = result.items
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.dialogSkuList.length < this.skuTotalCount
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
          this.dialogSkuList = [...this.dialogSkuList, ...result.items]
          this.skuTotalCount = result.totalCount || 0
          this.hasMoreSku = this.dialogSkuList.length < this.skuTotalCount
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

      // 过滤掉已存在的SKU
      const newSkus = this.tempSelectedSkus.filter(sku => !this.skuList.some(item => item.id === sku.id))

      if (newSkus.length === 0) {
        this.showError('所选SKU均已添加')
        return
      }

      // 添加新的SKU
      newSkus.forEach(sku => {
        this.skuList.push({
          ...sku,
          stocktakeNum: sku.stocktakeNum || 0,
          note: sku.note || ''
        })
      })

      this.closeSkuSelector()
      this.showSuccess(`成功添加 ${newSkus.length} 个SKU`)
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSkus = []
      this.dialogSearchKeyword = ''
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

/* 盘点图片卡片 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-count {
  font-size: 12px;
  color: #909399;
}

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.action-bar .scan-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  flex-shrink: 0;
}

.action-bar .add-sku-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  color: #fff;
  font-size: 14px;
}

.action-bar .add-sku-btn i {
  font-size: 14px;
}

.sku-count {
  font-size: 13px;
  color: #666;
  margin-left: auto;
}

/* SKU卡片 */
.item-card {
  margin-bottom: 15px;
}

.item-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
  flex-shrink: 0;
  cursor: pointer;
}

.item-basic-info {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-sku {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.delete-btn {
  color: #f56c6c;
  padding: 0;
  font-size: 18px;
}

/* 图片上传区域 */
.image-upload-wrapper {
  min-height: 80px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-image-item {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 6px;
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
  top: 2px;
  right: 2px;
  z-index: 10;
  padding: 0 !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
}

.remove-image-btn i {
  font-size: 10px;
}

.upload-btn-small {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
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
  font-size: 20px;
  color: #409eff;
}

.upload-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 15px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
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
  font-size: 28px;
  color: #409eff;
  margin-bottom: 8px;
}

.upload-btn span {
  font-size: 13px;
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
::v-deep .inventory-input-group .el-textarea__inner{
    height: 32px;
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

/* SKU选择弹窗样式 */
.dialog-search-bar {
  margin-bottom: 15px;
}

.dialog-search-bar .search-input-wrapper {
  width: 100%;
  position: relative;
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
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
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

.required {
  color: #f56c6c;
  margin-right: 2px;
}

.selected-count {
  font-size: 13px;
  color: #409eff;
  margin-bottom: 10px;
  padding: 6px 12px;
  background: #ecf5ff;
  border-radius: 4px;
}
</style>

