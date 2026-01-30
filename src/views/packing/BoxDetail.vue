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
          <span class="card-title">箱规图片</span>
        </div>
        <div class="card-body">
          <div class="image-upload-wrapper">
            <div v-if="boxData.imageUrl" class="preview-image">
              <img :src="boxData.imageUrl" alt="箱规图片" @click="previewImage" />
              <el-button
                type="danger"
                icon="el-icon-delete"
                circle
                size="mini"
                class="remove-image-btn"
                @click="removeImage"
              ></el-button>
            </div>
            <div v-else class="upload-btn" @click="triggerUpload">
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleFileChange"
                style="display: none"
              />
              <i class="el-icon-camera"></i>
              <span>点击上传图片</span>
            </div>
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
              <el-input v-model.number="boxData.length" type="number" placeholder="长" size="small"></el-input>
              <span class="size-separator">×</span>
              <el-input v-model.number="boxData.width" type="number" placeholder="宽" size="small"></el-input>
              <span class="size-separator">×</span>
              <el-input v-model.number="boxData.height" type="number" placeholder="高" size="small"></el-input>
            </div>
          </div>
          <!-- 重量 -->
          <div class="form-row">
            <label class="form-label">重量(kg)</label>
            <el-input v-model.number="boxData.weight" type="number" placeholder="请输入重量" size="small"></el-input>
          </div>
          <!-- 箱数 -->
          <div class="form-row">
            <label class="form-label">箱数</label>
            <el-input v-model.number="boxData.boxNum" type="number" placeholder="请输入箱数" size="small"></el-input>
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
                  <label>实际发货</label>
                  <el-input
                    v-model.number="sku.shippedQuantity"
                    type="number"
                    placeholder="0"
                    size="mini"
                    :max="sku.quantity"
                  ></el-input>
                </div>
                <div class="sku-form-row">
                  <label>重量(kg)</label>
                  <el-input v-model.number="sku.weight" type="number" placeholder="0" size="mini"></el-input>
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
          :key="sku.id"
          class="sku-option"
          :class="{ selected: isSkuSelected(sku) }"
          @click="toggleSkuSelection(sku)"
        >
          <div class="sku-option-info">
            <div class="sku-option-name">{{ sku.productName || '-' }}</div>
            <div class="sku-option-code">SKU: {{ sku.sku || '-' }} | 数量: {{ sku.quantity || 0 }}</div>
          </div>
          <el-checkbox :value="isSkuSelected(sku)" @click.native.stop></el-checkbox>
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
        imageUrl: '',
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
      tempSelectedSkus: []
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
  methods: {
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
          this.boxData = {
            ...savedData,
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
      this.$refs.fileInput.click()
    },
    async handleFileChange(e) {
      const file = e.target.files[0]
      if (!file) return

      this.showLoading()
      try {
        const result = await uploadImages(file)
        this.boxData.imageUrl =  result[0]
        this.showSuccess('图片上传成功')
      } catch (error) {
        console.error('图片上传失败:', error)
        this.showError('图片上传失败，请重试')
      } finally {
        this.hideLoading()
        e.target.value = ''
      }
    },
    removeImage() {
      this.boxData.imageUrl = ''
    },
    previewImage() {
      // 可以添加图片预览功能
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
      this.tempSelectedSkus = [...this.boxData.boxSizeItems]
      this.showSkuSelector = true
    },
    closeSkuSelector() {
      this.showSkuSelector = false
      this.tempSelectedSkus = []
    },
    isSkuSelected(sku) {
      return this.tempSelectedSkus.some(s => s.id === sku.id || s.sku === sku.sku)
    },
    toggleSkuSelection(sku) {
      const index = this.tempSelectedSkus.findIndex(s => s.id === sku.id || s.sku === sku.sku)
      if (index > -1) {
        this.tempSelectedSkus.splice(index, 1)
      } else {
        this.tempSelectedSkus.push({
          ...sku,
          shippedQuantity: 0,
          weight: 0
        })
      }
    },
    confirmSkuSelection() {
      this.boxData.boxSizeItems = [...this.tempSelectedSkus]
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
      if (!this.boxData.boxNum) {
        this.showError('请填写箱数')
        return
      }
      if (this.boxData.boxSizeItems.length === 0) {
        this.showError('请选择至少一个SKU')
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
            imageUrl: this.boxData.imageUrl || '',
            length: this.boxData.length,
            width: this.boxData.width,
            height: this.boxData.height,
            boxNum: this.boxData.boxNum,
            weight: this.boxData.weight || 0,
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

.preview-image {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
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
</style>
