<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>无采购单盘点</h1>
    </div>

    <div class="result-container">
      <!-- SKU搜索区域 -->
      <div class="card">
        <div class="card-body">
          <div class="sku-search-bar">
            <el-input
              v-model="skuSearchKeyword"
              placeholder="输入SKU搜索"
              size="small"
              clearable
              @keypress.enter.native="handleSearch"
              @clear="handleSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
            </el-input>
            <button class="scan-icon-btn-small" @click="handleScan">
              <span class="scan-icon"></span>
            </button>
            <el-button type="primary" size="small" @click="openSkuSelector">选择SKU</el-button>
          </div>
        </div>
      </div>

      <!-- 选中的SKU信息 -->
      <div v-if="selectedSku" class="card">
        <div class="card-header">
          <span class="card-title">基本信息</span>
        </div>
        <div class="card-body">
          <div>
            <span class="label" style="margin-right:5px"><span class="required">*</span>货位：</span>
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
      <div v-if="selectedSku" class="card">
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
      <div v-if="selectedSku" class="section-title">
        <div class="section-title-left">
          <span>商品明细</span>
        </div>
      </div>

      <!-- 商品卡片 -->
      <div v-if="selectedSku" class="card item-card">
        <div class="item-card-header">
          <img
            class="item-image"
            :src="getThumbImage(selectedSku.mainImage)"
            referrerpolicy="no-referrer"
            @click="openSkuImagePreview"
            @error="handleImageError"
          />
          <div class="item-basic-info">
            <div class="item-name">{{ selectedSku.productName || '-' }}</div>
            <div class="item-sku">SKU: {{ selectedSku.sku || '-' }}</div>
            <div v-if="selectedSku.goodsNumber" class="item-sku">货号: {{ selectedSku.goodsNumber }}</div>
          </div>
        </div>
        <div class="item-info">
          <div class="item-inventory-input">
            <div class="inventory-input-group">
              <label style="margin-right:5px">本次盘点:</label>
              <el-input-number
                v-model="stocktakeNum"
                :min="0"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!selectedSku" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>请选择或搜索SKU进行盘点</p>
      </div>

      <!-- 底部操作按钮 -->
      <div v-if="selectedSku" class="bottom-action">
        <el-button class="action-btn reset-btn" @click="handleClear">
          清空
        </el-button>
        <el-button type="primary" class="action-btn submit-btn" @click="handleSubmit">
          提交盘点
        </el-button>
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
        <el-input
          v-model="dialogSearchKeyword"
          placeholder="输入SKU、商品名称或货号搜索"
          size="small"
          clearable
          prefix-icon="el-icon-search"
          @input="handleDialogSearchInput"
          @clear="handleDialogSearchClear"
        />
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
            <div class="sku-option-code">SKU: {{ sku.sku || '-' }} | 货号: {{ sku.goodsNumber || '-' }}</div>
          </div>
          <!-- <el-radio :value="tempSelectedSku && tempSelectedSku.id === sku.id"></el-radio> -->
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
import ImagePreview from '../../components/ImagePreview.vue'

export default {
  name: 'NoPurchaseOrder',
  components: {
    ImagePreview
  },
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess', 'getGoodsLocationList'],
  data() {
    return {
      skuSearchKeyword: '',
      dialogSearchKeyword: '',
      selectedSku: null,
      tempSelectedSku: null,
      skuList: [],
      showSkuSelector: false,
      uploadedImages: [],
      stocktakeNum: 0,
      selectedGoodsLocationId: null,
      isScanning: false,
      html5QrCode: null,
      previewVisible: false,
      previewImages: [],
      previewIndex: 0,
      dialogSearchTimer: null,
      skuCurrentPage: 1,
      skuTotalCount: 0,
      hasMoreSku: true,
      isLoadingMoreSku: false
    }
  },
  computed: {
    goodsLocationList() {
      return this.getGoodsLocationList()
    }
  },
  mounted() {
    // 货位选择逻辑：使用上次选择的货位
    const lastSelectedLocationId = localStorage.getItem('lastSelectedGoodsLocationId')
    if (lastSelectedLocationId) {
      this.selectedGoodsLocationId = lastSelectedLocationId
    }
  },
  beforeDestroy() {
    if (this.dialogSearchTimer) {
      clearTimeout(this.dialogSearchTimer)
    }
    this.closeScannerOverlay()
  },
  methods: {
    goBack() {
      this.$router.push('/inventory/index')
    },
    async handleSearch() {
      if (!this.skuSearchKeyword.trim()) {
        this.showError('请输入SKU进行搜索')
        return
      }

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
            content: this.skuSearchKeyword
          },
          sorting: '',
          skipCount: 1,
          maxResultCount: 25
        }

        const result = await getCommodityStockTake(params)
        if (result && result.items && result.items.length > 0) {
          // 如果只有一个结果，直接选中
          if (result.items.length === 1) {
            this.selectedSku = result.items[0]
            this.stocktakeNum = 0
            this.uploadedImages = []
            this.showSuccess('已找到SKU')
          } else {
            // 多个结果，显示选择弹窗
            this.skuList = result.items
            this.dialogSearchKeyword = ''
            this.showSkuSelector = true
          }
        } else {
          this.showError('未找到匹配的SKU')
        }
      } catch (error) {
        console.error('搜索SKU失败:', error)
        this.showError(error.message || '搜索失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
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
          maxResultCount: 25
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
          maxResultCount: 25
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
          maxResultCount: 25
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
    getThumbImage(imageUrl) {
      if (!imageUrl) return ''
      // 添加缩略图参数
      return imageUrl + '?imageView2/w/75/h/75'
    },
    // 上传图片区域的缩略图
    getUploadThumbImage(imageUrl) {
      if (!imageUrl) return ''
      return imageUrl + '?x-oss-process=image/resize,m_pad,w_150,h_150,limit_0'
    },
    getOriginalImage(imageUrl) {
      if (!imageUrl) return ''
      // 移除缩略图参数，返回原图
      return imageUrl.replace(/\?imageView2\/w\/\d+\/h\/\d+$/, '')
    },
    openSkuImagePreview() {
      if (this.selectedSku && this.selectedSku.mainImage) {
        this.previewImages = [this.getOriginalImage(this.selectedSku.mainImage)]
        this.previewIndex = 0
        this.previewVisible = true
      }
    },
    confirmSkuSelection() {
      if (!this.tempSelectedSku) {
        this.showError('请选择一个SKU')
        return
      }
      this.selectedSku = this.tempSelectedSku
      this.stocktakeNum = 0
      this.uploadedImages = []
      this.closeSkuSelector()
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSku = null
      this.dialogSearchKeyword = ''
    },
    handleClear() {
      this.selectedSku = null
      this.stocktakeNum = 0
      this.uploadedImages = []
      this.skuSearchKeyword = ''
      this.showSuccess('已清空')
    },
    async handleSubmit() {
      if (!this.selectedSku) {
        this.showError('请选择SKU')
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
        // 获取选中的货位信息
        const selectedLocation = this.goodsLocationList.find(item => item.id === this.selectedGoodsLocationId)

        const params = {
          goodsLocationId: this.selectedGoodsLocationId || '',
          goodsNumber: selectedLocation ? selectedLocation.goodsNumber : '',
          images: this.uploadedImages || [],
          stocktakeNum: this.stocktakeNum,
          id: this.selectedSku.id || ''
        }

        await commoditySubmitStockTake(params)

        // 保存本次选择的货位ID，供下次使用
        if (this.selectedGoodsLocationId) {
          localStorage.setItem('lastSelectedGoodsLocationId', this.selectedGoodsLocationId)
        }

        this.showSuccess('提交盘点成功')
        this.hideLoading()

        // 清空数据
        this.handleClear()
      } catch (error) {
        console.error('提交盘点失败:', error)
        this.showError(error.message || '提交���点失败，请重试')
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
    },
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
        this.html5QrCode = new Html5Qrcode('scanner-video-container')

        // 全屏扫描配置 - 不限制扫描区域，提高识别速度
        const config = {
          fps: 10,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
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

        // 高清摄像头配置，支持自动对焦
        const cameraConfig = {
          facingMode: 'environment',
          width: { min: 640, ideal: 1920, max: 2560 },
          height: { min: 480, ideal: 1080, max: 1440 },
          focusMode: 'continuous',
          advanced: [{ focusMode: 'continuous' }]
        }

        try {
          await this.html5QrCode.start(
            cameraConfig,
            config,
            async (decodedText) => {
              console.log('扫描到条码:', decodedText)
              await this.closeScannerOverlay()
              this.skuSearchKeyword = decodedText
              this.handleSearch()
            },
            () => {}
          )
        } catch (error) {
          console.log('HD摄像头启动失败，尝试使用默认配置:', error)
          await this.html5QrCode.start(
            { facingMode: 'environment' },
            config,
            async (decodedText) => {
              console.log('扫描到条码:', decodedText)
              await this.closeScannerOverlay()
              this.skuSearchKeyword = decodedText
              this.handleSearch()
            },
            () => {}
          )
        }
      } catch (error) {
        console.error('摄像头访问失败:', error)
        await this.closeScannerOverlay()

        const errorMessages = {
          NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
          NotFoundError: '未找到摄像头设备',
          NotReadableError: '摄像头被其他应用占用'
        }
        this.showError(errorMessages[error.name] || '无法启动摄像头扫码')
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
.result-container {
  padding-bottom: 80px;
}

/* SKU搜索栏 */
.sku-search-bar {
  display: flex;
  gap: 10px;
}

.sku-search-bar .el-input {
  flex: 1;
}

/* 小扫码按钮 */
.scan-icon-btn-small {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.scan-icon-btn-small:hover,
.scan-icon-btn-small:active {
  border-color: #409eff;
  background: #ecf5ff;
}

.scan-icon-btn-small .scan-icon {
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23409eff' stroke-width='2'%3E%3Cpath d='M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2M12 3v18'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
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

/* SKU选择弹窗样式 */
.dialog-search-bar {
  margin-bottom: 15px;
}

.sku-options-list {
  max-height: 50vh;
  overflow-y: auto;
}

.sku-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.sku-option:hover {
  border-color: #409eff;
}

.sku-option.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.sku-option-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
  background: #f5f5f5;
  border: 1px solid #ebeef5;
}

.sku-option-info {
  flex: 1;
}

.sku-option-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.sku-option-code {
  font-size: 12px;
  color: #909399;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  color: #909399;
}

/* 加载更多 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  color: #909399;
  font-size: 13px;
}

.loading-more i {
  margin-right: 8px;
}

/* 没有更多数据 */
.no-more-data {
  text-align: center;
  padding: 15px;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
