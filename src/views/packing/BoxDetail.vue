<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>箱规详情</h1>
    </div>

    <!-- 详情容器 -->
    <div class="result-container">
      <!-- 图片上传区域 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">箱规图片（最多5张）</span>
          <span class="image-count">{{ boxData.imageUrls.length }}/5</span>
        </div>
        <div class="card-body">
          <div class="image-upload-wrapper">
            <!-- 已上传的图片列表 -->
            <div v-if="boxData.imageUrls.length > 0" class="image-list">
              <div
                v-for="(url, index) in boxData.imageUrls"
                :key="index"
                class="preview-image-item"
              >
                <img :src="url" alt="箱规图片" @click="previewImage(index)" />
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
              <div v-if="boxData.imageUrls.length < 5" class="upload-btn-small" @click="triggerUpload">
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

      <!-- 箱规信息表单 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">箱规信息</span>
        </div>
        <div class="card-body form-body">
          <!-- 尺寸：长*宽*高 -->
          <div class="form-row">
            <label class="form-label">尺寸(cm)</label>
            <div class="size-inputs">
              <el-input
                v-model="boxData.length"
                type="text"
                inputmode="decimal"
                placeholder="长"
                size="small"
                @input="val => boxData.length = formatDecimal(val)"
              ></el-input>
              <span class="size-separator">×</span>
              <el-input
                v-model="boxData.width"
                type="text"
                inputmode="decimal"
                placeholder="宽"
                size="small"
                @input="val => boxData.width = formatDecimal(val)"
              ></el-input>
              <span class="size-separator">×</span>
              <el-input
                v-model="boxData.height"
                type="text"
                inputmode="decimal"
                placeholder="高"
                size="small"
                @input="val => boxData.height = formatDecimal(val)"
              ></el-input>
            </div>
          </div>
          <!-- 重量 -->
          <div class="form-row">
            <label class="form-label">重量(kg)<span class="required-mark">*</span></label>
            <el-input
              v-model="boxData.weight"
              type="text"
              inputmode="decimal"
              placeholder="请输入重量"
              size="small"
              @input="val => boxData.weight = formatDecimal(val)"
            ></el-input>
          </div>
          <!-- 箱数 -->
          <div class="form-row">
            <label class="form-label">箱数</label>
            <el-input v-model.number="boxData.boxNum" type="text" inputmode="numeric" placeholder="请输入箱数" size="small"></el-input>
          </div>
        </div>
      </div>

      <!-- SKU选择区域 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">SKU列表</span>
          <span class="item-count">已选 {{ boxData.boxSizeItems.length }} 个</span>
        </div>
        <div class="card-body">
          <div class="sku-search-bar">
            <el-input
              v-model="skuSearchKeyword"
              placeholder="输入SKU搜索"
              size="small"
              clearable
              @keypress.enter.native="searchSku"
              @clear="searchSku"
            >
              <el-button slot="append" icon="el-icon-search" @click="searchSku"></el-button>
            </el-input>
            <button class="scan-icon-btn-small" @click="handleSkuScan">
              <span class="scan-icon"></span>
            </button>
            <el-button type="primary" size="small" @click="openSkuSelector">选择</el-button>
          </div>

          <!-- 已选择的SKU列表 -->
          <div class="selected-sku-list" v-if="boxData.boxSizeItems.length > 0">
            <div v-if="filteredBoxSizeItems.length === 0" class="empty-search">
              <p>未找到匹配的SKU</p>
            </div>
            <div
              v-for="(sku, index) in filteredBoxSizeItems"
              :key="sku.id || sku.sku || index"
              class="sku-item"
            >
              <div class="sku-header">
                <div class="sku-info">
                  <div class="sku-name">{{ sku.productName || '-' }}</div>
                  <div class="sku-code">SKU: {{ sku.sku || '-' }} | 计划数量: {{ sku.quantity || 0 }}</div>
                </div>
                <el-button type="text" icon="el-icon-delete" class="delete-btn" @click="removeSku(sku)"></el-button>
              </div>
              <div class="sku-form">
                <div class="sku-form-row">
                  <label>实际发货<span class="required-mark">*</span></label>
                  <el-input
                    v-model.number="sku.shippedQuantity"
                    type="text"
                    inputmode="numeric"
                    placeholder="0"
                    size="mini"
                    :max="sku.quantity"
                  ></el-input>
                </div>
                <div class="sku-form-row">
                  <label>重量(kg)</label>
                  <el-input v-model.number="sku.weight" type="text" inputmode="decimal" placeholder="0" size="mini"></el-input>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-sku">
            <i class="el-icon-box"></i>
            <p>暂未选择SKU，请点击选择按钮添加</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部确定装箱按钮 -->
    <div class="bottom-action">
      <el-button type="success" class="confirm-btn" @click="handleConfirmBox">
        <i class="el-icon-check"></i>
        确定装箱
      </el-button>
    </div>

    <!-- SKU选择弹窗 -->
    <el-dialog
      title="选择SKU"
      :visible.sync="showSkuSelector"
      width="90%"
      :close-on-click-modal="false"
      custom-class="sku-dialog"
    >
      <div class="sku-options-list">
        <div
          v-for="sku in availableSkus"
          :key="sku.id || sku.sku"
          class="sku-option"
          :class="{ selected: isSkuSelected(sku) }"
          @click="toggleSkuSelection(sku)"
        >
          <div class="sku-option-info">
            <div class="sku-option-name">{{ sku.productName || '-' }}</div>
            <div class="sku-option-code">SKU: {{ sku.sku || '-' }} | 数量: {{ sku.quantity || 0 }}</div>
          </div>
          <el-checkbox :value="isSkuSelected(sku)" @click.native.stop="toggleSkuSelection(sku)"></el-checkbox>
        </div>
        <div v-if="availableSkus.length === 0" class="empty-state">
          <p>暂无可选SKU</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeSkuSelector">取消</el-button>
        <el-button type="primary" @click="confirmSkuSelection">确定</el-button>
      </span>
    </el-dialog>

    <!-- SKU扫码器遮罩 -->
    <div v-if="isSkuScanning" class="scanner-overlay">
      <div class="scanner-header">
        <button class="scanner-close-btn" @click="closeSkuScannerOverlay">&times;</button>
        <span>扫描SKU条形码</span>
      </div>
      <div class="scanner-video-container" id="sku-scanner-video-container"></div>
      <p class="scanner-tip">将条形码对准扫描框</p>
    </div>
  </div>
</template>

<script>
import { createBoxSize, modifyBoxSize, uploadImages } from '../../api'

export default {
  name: 'BoxDetail',
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      packingItem: null,
      boxIndex: 0,
      isEdit: false,
      boxData: {
        imageUrls: [],
        length: null,
        width: null,
        height: null,
        boxNum: null,
        weight: null,
        skuNum: 0,
        shippedQuantity: 0,
        boxSizeItems: []
      },
      skuSearchKeyword: '',
      showSkuSelector: false,
      availableSkus: [],
      tempSelectedSkus: [],
      isSkuScanning: false,
      skuHtml5QrCode: null
    }
  },
  computed: {
    // 计划发货总数（从skus的quantity字段求和）
    totalQuantity() {
      if (!this.packingItem || !this.packingItem.skus) return 0
      return this.packingItem.skus.reduce((sum, sku) => sum + (sku.quantity || 0), 0)
    },
    // 已输入的发货数量总和
    inputtedQuantity() {
      return this.boxData.boxSizeItems.reduce((sum, sku) => sum + (sku.shippedQuantity || 0), 0)
    },
    // 剩余可填数量
    remainingQuantity() {
      return this.totalQuantity - this.inputtedQuantity
    },
    // 过滤后的已选择SKU列表
    filteredBoxSizeItems() {
      if (!this.skuSearchKeyword.trim()) {
        return this.boxData.boxSizeItems
      }
      const keyword = this.skuSearchKeyword.toLowerCase()
      return this.boxData.boxSizeItems.filter(sku =>
        (sku.sku && sku.sku.toLowerCase().includes(keyword)) ||
        (sku.productName && sku.productName.toLowerCase().includes(keyword))
      )
    }
  },
  mounted() {
    this.initData()
  },
  beforeDestroy() {
    this.closeSkuScannerOverlay()
  },
  methods: {
    // 格式化小数输入，最多保留两位小数
    formatDecimal(value) {
      if (value === '' || value === null || value === undefined) return ''
      // 移除非数字和小数点的字符
      let val = String(value).replace(/[^\d.]/g, '')
      // 确保只有一个小数点
      const parts = val.split('.')
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('')
      }
      // 限制小数点后最多两位
      if (parts.length === 2 && parts[1].length > 2) {
        val = parts[0] + '.' + parts[1].substring(0, 2)
      }
      return val
    },
    initData() {
      const packingItemStr = sessionStorage.getItem('packingItem')
      if (packingItemStr) {
        this.packingItem = JSON.parse(packingItemStr)
        this.availableSkus = this.packingItem.skus || []
      }

      this.boxIndex = parseInt(this.$route.query.boxIndex) || 0

      const boxListStr = sessionStorage.getItem('boxList_' + this.$route.query.id)
      if (boxListStr) {
        const boxList = JSON.parse(boxListStr)
        if (boxList[this.boxIndex]) {
          const savedData = boxList[this.boxIndex]
          // 处理图片URL：优先使用imageUrls数组，否则将imageUrl字符串转换为数组
          let imageUrls = []
          if (Array.isArray(savedData.imageUrls)) {
            imageUrls = savedData.imageUrls
          } else if (savedData.imageUrl) {
            // 如果imageUrl是逗号分隔的字符串，分割成数组
            imageUrls = savedData.imageUrl.split(',').filter(Boolean)
          }

          this.boxData = {
            ...savedData,
            imageUrls: imageUrls,
            length: savedData.length || null,
            width: savedData.width || null,
            height: savedData.height || null,
            boxNum: savedData.boxNum || null,
            weight: savedData.weight || null,
            shippedQuantity: savedData.shippedQuantity || 0
          }
          this.isEdit = !!this.boxData.id
        }
      }
    },
    goBack() {
      this.$router.push({
        path: '/packing/box-list',
        query: { id: this.$route.query.id }
      })
    },
    triggerUpload() {
      if (this.boxData.imageUrls.length >= 5) {
        this.showError('最多只能上传5张图片')
        return
      }
      this.$refs.fileInput.click()
    },
    async handleFileChange(e) {
      const file = e.target.files[0]
      if (!file) return

      if (this.boxData.imageUrls.length >= 5) {
        this.showError('最多只能上传5张图片')
        e.target.value = ''
        return
      }

      this.showLoading()
      try {
        const result = await uploadImages(file)
        const imageUrl = result[0]
        this.boxData.imageUrls.push(imageUrl)
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
      this.boxData.imageUrls.splice(index, 1)
    },
    previewImage(index) {
      // 可以添加图片预览功能
      console.log('预览图片:', this.boxData.imageUrls[index])
    },
    searchSku() {
      if (!this.skuSearchKeyword.trim()) {
        this.availableSkus = this.packingItem?.skus || []
        return
      }
      const keyword = this.skuSearchKeyword.toLowerCase()
      this.availableSkus = (this.packingItem?.skus || []).filter(sku =>
        (sku.sku && sku.sku.toLowerCase().includes(keyword)) ||
        (sku.productName && sku.productName.toLowerCase().includes(keyword))
      )
    },
    openSkuSelector() {
      // 深拷贝已选择的SKU，避免引用问题
      this.tempSelectedSkus = JSON.parse(JSON.stringify(this.boxData.boxSizeItems))
      this.showSkuSelector = true
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSkus = []
    },
    isSkuSelected(sku) {
      return this.tempSelectedSkus.some(s => {
        // 优先使用 id 匹配，如果没有 id 则使用 sku 字段匹配
        if (s.id && sku.id) {
          return s.id === sku.id
        }
        return s.sku === sku.sku
      })
    },
    toggleSkuSelection(sku) {
      const index = this.tempSelectedSkus.findIndex(s => {
        // 优先使用 id 匹配，如果没有 id 则使用 sku 字段匹配
        if (s.id && sku.id) {
          return s.id === sku.id
        }
        return s.sku === sku.sku
      })

      if (index > -1) {
        // 已选中，移除
        this.tempSelectedSkus.splice(index, 1)
      } else {
        // 未选中，添加
        this.tempSelectedSkus.push({
          ...sku,
          shippedQuantity: 0,
          weight: 0
        })
      }

      // 强制更新视图
      this.$forceUpdate()
    },
    confirmSkuSelection() {
      // 深拷贝，避免引用问题
      this.boxData.boxSizeItems = JSON.parse(JSON.stringify(this.tempSelectedSkus))
      this.boxData.skuNum = this.boxData.boxSizeItems.length
      this.closeSkuSelector()
    },
    removeSku(sku) {
      const index = this.boxData.boxSizeItems.findIndex(s => s.id === sku.id || s.sku === sku.sku)
      if (index > -1) {
        this.boxData.boxSizeItems.splice(index, 1)
        this.boxData.skuNum = this.boxData.boxSizeItems.length
      }
    },
    async handleConfirmBox() {
      if (!this.boxData.length || !this.boxData.width || !this.boxData.height) {
        this.showError('请填写箱子尺寸')
        return
      }
      if (!this.boxData.weight || this.boxData.weight <= 0) {
        this.showError('请填写箱子重量')
        return
      }
      if (!this.boxData.boxNum) {
        this.showError('请填写箱数')
        return
      }
      if (this.boxData.boxSizeItems.length === 0) {
        this.showError('请选择至少一个SKU')
        return
      }

      // 验证每个SKU的实际发货数量
      const invalidSkus = this.boxData.boxSizeItems.filter(sku => !sku.shippedQuantity || sku.shippedQuantity <= 0)
      if (invalidSkus.length > 0) {
        this.showError('请填写所有SKU的实际发货数量')
        return
      }

      this.showLoading()
      try {
        // 更新boxData的shippedQuantity为已输入的总和
        this.boxData.shippedQuantity = this.inputtedQuantity

        const params = {
          chainShipPlanId: this.boxData.chainShipPlanItemId || this.$route.query.id,
          isPc: true,
          boxSize: [{
            imageUrls: this.boxData.imageUrls || [],
            length: parseFloat(this.boxData.length) || 0,
            width: parseFloat(this.boxData.width) || 0,
            height: parseFloat(this.boxData.height) || 0,
            boxNum: this.boxData.boxNum,
            weight: parseFloat(this.boxData.weight) || 0,
            skuNum: this.boxData.skuNum,
            shippedQuantity: this.boxData.shippedQuantity,
            boxSizeItems: this.boxData.boxSizeItems.map(item => ({
              sku: item.sku,
              productName: item.productName,
              shippedQuantity: item.shippedQuantity,
              weight: item.weight,
              id: item.id || ''
            })),
            id: this.boxData.id || ''
          }],
          // id: this.boxData.id || ''
        }

        if (this.isEdit && this.boxData.id) {
          await modifyBoxSize(params)
        } else {
          const result = await createBoxSize(params)
          if (result && result.id) {
            this.boxData.id = result.id
          }
        }

        // 清除箱规列表缓存，返回列表页时会重新从接口获取最新数据
        sessionStorage.removeItem('boxList_' + this.$route.query.id)

        this.showSuccess(this.isEdit ? '修改成功' : '创建成功')
        this.goBack()
      } catch (error) {
        console.error('保存箱规失败:', error)
        this.showError(error.message || '保存失败，请重试')
      } finally {
        this.hideLoading()
      }
    },
    async handleSkuScan() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showError('当前浏览器不支持摄像头功能')
        return
      }

      if (!window.isSecureContext) {
        this.showError('请使用 HTTPS 协议访问本页面以启用摄像头功能')
        return
      }

      await this.startSkuScanning()
    },
    async startSkuScanning() {
      if (this.isSkuScanning) return

      try {
        this.isSkuScanning = true
        await this.$nextTick()

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        this.skuHtml5QrCode = new Html5Qrcode('sku-scanner-video-container')

        const container = document.getElementById('sku-scanner-video-container')
        const containerWidth = container ? container.clientWidth : 350
        const containerHeight = container ? container.clientHeight : 400
        const qrboxWidth = Math.floor(containerWidth * 0.9)
        const qrboxHeight = Math.floor(containerHeight * 0.6)

        const config = {
          fps: 30,
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          disableFlip: true,
          aspectRatio: 1.777778,
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

        try {
          await this.skuHtml5QrCode.start(
            { facingMode: 'environment' },
            config,
            async (decodedText) => {
              console.log('扫描到SKU条码:', decodedText)
              await this.closeSkuScannerOverlay()
              this.skuSearchKeyword = decodedText
              this.searchSku()
            },
            () => {}
          )
        } catch (error) {
          console.log('后置摄像头启动失败，尝试使用默认摄像头:', error)
          await this.skuHtml5QrCode.start(
            { facingMode: 'user' },
            config,
            async (decodedText) => {
              console.log('扫描到SKU条码:', decodedText)
              await this.closeSkuScannerOverlay()
              this.skuSearchKeyword = decodedText
              this.searchSku()
            },
            () => {}
          )
        }
      } catch (error) {
        console.error('摄像头访问失败:', error)
        await this.closeSkuScannerOverlay()

        const errorMessages = {
          NotAllowedError: '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头',
          NotFoundError: '未找到摄像头设备',
          NotReadableError: '摄像头被其他应用占用'
        }
        this.showError(errorMessages[error.name] || '无法启动摄像头扫码')
      }
    },
    async closeSkuScannerOverlay() {
      this.isSkuScanning = false

      if (this.skuHtml5QrCode) {
        try {
          const { Html5QrcodeScannerState } = await import('html5-qrcode')
          if (this.skuHtml5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
            await this.skuHtml5QrCode.stop()
          }
        } catch (e) {
          console.log('停止扫描器时出错:', e)
        }
        this.skuHtml5QrCode = null
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

/* 图片列表 */
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

/* 小的上传按钮 */
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

/* 初始上传按钮 */
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

/* 表单样式 */
.form-body {
  padding: 12px 15px;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
}

.required-mark {
  color: #f56c6c;
  margin-left: 2px;
}

.form-row .el-input {
  flex: 1;
}

/* 尺寸输入框 */
.size-inputs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-inputs .el-input {
  flex: 1;
}

.size-separator {
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
}

/* SKU搜索栏 */
.sku-search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.sku-search-bar .el-input {
  flex: 1;
}

/* SKU列表 */
.selected-sku-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sku-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ebeef5;
}

.sku-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.sku-info {
  flex: 1;
}

.sku-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}

.sku-code {
  font-size: 12px;
  color: #909399;
}

.delete-btn {
  color: #f56c6c;
  padding: 0;
}

.sku-form {
  display: flex;
  gap: 12px;
}

.sku-form-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sku-form-row label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.sku-form-row .el-input {
  flex: 1;
}

/* 空状态 */
.empty-sku {
  text-align: center;
  padding: 30px 20px;
  color: #909399;
}

.empty-search {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 13px;
}

.empty-sku i {
  font-size: 40px;
  margin-bottom: 10px;
  display: block;
}

.empty-sku p {
  font-size: 13px;
}

/* 底部操作区 */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 15px;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  letter-spacing: 2px;
}

.confirm-btn i {
  margin-right: 6px;
}

/* SKU选择弹窗样式 */
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
</style>
