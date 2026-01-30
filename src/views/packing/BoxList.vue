<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>箱规列表</h1>
      <!-- 新建箱规按钮放在头部右侧 -->
      <el-button
        class="header-add-btn"
        type="primary"
        size="mini"
        icon="el-icon-plus"
        @click="addNewBox"
      >新建</el-button>
    </div>

    <!-- 列表容器 -->
    <div class="list-container" ref="listContainer">
      <div class="list-content">
        <div
          v-for="(box, index) in boxList"
          :key="box.tempId || box.id"
          class="list-card"
          @click="continueBox(index)"
        >
          <!-- 第一行：箱子标题 + 状态 + 操作按钮 -->
          <div class="list-card-header">
            <div class="header-left">
              <span class="purchase-no">箱子 {{ index + 1 }}</span>
              <span v-if="box.id" class="status-badge completed">已保存</span>
              <span v-else class="status-badge pending">未保存</span>
            </div>
            <div class="box-actions" @click.stop>
              <el-button size="mini" type="text" icon="el-icon-document-copy" @click="copyBox(index)">复制</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="delete-btn"
                @click="deleteBox(index)"
                :disabled="boxList.length <= 1"
              >删除</el-button>
            </div>
          </div>
          <!-- 箱规内容区域：图片 + 信息 -->
          <div class="box-content">
            <!-- 箱规图片 -->
            <div v-if="box.imageUrl" class="box-image-preview">
              <img :src="getThumbnailUrl(box.imageUrl)" alt="箱规图片" />
            </div>
            <!-- 箱规信息 -->
            <div class="box-info-wrapper">
              <div class="box-info-row">
                <span class="info-label">尺寸：</span>
                <span class="info-value">{{ box.length || 0 }} × {{ box.width || 0 }} × {{ box.height || 0 }} cm</span>
              </div>
              <div class="box-info-row">
                <span class="info-label">重量：</span>
                <span class="info-value">{{ box.weight || 0 }} kg</span>
              </div>
              <div class="box-info-row">
                <span class="info-label">箱数：</span>
                <span class="info-value">{{ box.boxNum || 0 }}</span>
              </div>
            </div>
          </div>
          <!-- 底部提示 -->
          <div class="card-tip">
            <span>
              点击卡片
              <span style="color: #409eff;">继续装箱</span>
            </span>
            <i class="el-icon-arrow-right"></i>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="boxList.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>暂无箱规数据</p>
        <el-button type="primary" size="small" @click="addNewBox">新建箱规</el-button>
      </div>
    </div>

    <!-- 底部确定打包按钮 -->
    <div class="bottom-action">
      <el-button type="success" class="confirm-btn" @click="handleConfirmPackaging">
        <i class="el-icon-check"></i>
        确定打包
      </el-button>
    </div>
  </div>
</template>

<script>
import { confirmPackaging, getPlanBoxSize, removeBoxSize } from '../../api'

export default {
  name: 'BoxList',
  inject: ['showLoading', 'hideLoading', 'showError', 'showSuccess'],
  data() {
    return {
      packingItem: null,
      boxList: [],
      isLoading: true
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    // 生成缩略图URL
    getThumbnailUrl(url) {
      if (!url) return ''
      // 如果URL已经包含参数，使用&连接，否则使用?连接
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}imageView2/w/75/h/75`
    },
    async initData() {
      const packingItemStr = sessionStorage.getItem('packingItem')
      if (packingItemStr) {
        this.packingItem = JSON.parse(packingItemStr)
      }

      // 先检查sessionStorage中是否有缓存的箱规列表
      const boxListStr = sessionStorage.getItem('boxList_' + this.$route.query.id)
      if (boxListStr) {
        this.boxList = JSON.parse(boxListStr)
        this.isLoading = false
        return
      }

      // 从接口获取箱规列表
      this.showLoading()
      try {
        const result = await getPlanBoxSize(this.$route.query.id)
        if (result && result.length > 0) {
          // 适配接口返回的数据结构
          this.boxList = result.map(item => ({
            id: item.id || '',
            chainShipPlanItemId: item.chainShipPlanItemId || '',
            imageUrl: item.imageUrl || '',
            length: item.length || 0,
            width: item.width || 0,
            height: item.height || 0,
            boxNum: item.boxNum || 0,
            weight: item.weight || 0,
            skuNum: item.skuNum || 0,
            shippedQuantity: item.shippedQuantity || 0,
            boxSizeItems: (item.boxSizeItems || []).map(sku => ({
              id: sku.id || '',
              boxSizeId: sku.boxSizeId || '',
              sku: sku.sku || '',
              productName: sku.productName || '',
              shippedQuantity: sku.shippedQuantity || 0,
              weight: sku.weight || 0,
              quantity: sku.quantity || sku.shippedQuantity || 0
            }))
          }))
          this.saveBoxList()
        } else {
          // 没有数据时创建一个空箱子
          this.boxList = [this.createEmptyBox()]
        }
      } catch (error) {
        console.error('获取箱规列表失败:', error)
        // 获取失败时创建一个空箱子
        this.boxList = [this.createEmptyBox()]
      } finally {
        this.hideLoading()
        this.isLoading = false
      }
    },
    createEmptyBox() {
      return {
        tempId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        imageUrl: '',
        length: 0,
        width: 0,
        height: 0,
        boxNum: 0,
        weight: 0,
        skuNum: 0,
        shippedQuantity: 0,
        boxSizeItems: []
      }
    },
    saveBoxList() {
      sessionStorage.setItem('boxList_' + this.$route.query.id, JSON.stringify(this.boxList))
    },
    goBack() {
      sessionStorage.removeItem('boxList_' + this.$route.query.id)
      this.$router.push('/packing/list')
    },
    addNewBox() {
      this.boxList.push(this.createEmptyBox())
      this.saveBoxList()
    },
    copyBox(index) {
      const originalBox = this.boxList[index]
      const copiedBox = {
        ...JSON.parse(JSON.stringify(originalBox)),
        tempId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        id: undefined
      }
      this.boxList.splice(index + 1, 0, copiedBox)
      this.saveBoxList()
      this.showSuccess('复制成功')
    },
    async deleteBox(index) {
      if (this.boxList.length <= 1) {
        this.showError('至少保留一个箱子')
        return
      }

      // 弹出确认对话框
      try {
        await this.$confirm('确定要删除这个箱规吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        // 用户点击取消，直接返回
        return
      }

      const box = this.boxList[index]

      // 如果箱子有id，说明已保存到服务器，需要调用接口删除
      if (box.id) {
        this.showLoading()
        try {
          await removeBoxSize(box.id)
          this.showSuccess('删除成功')
          // 清除缓存并重新加载列表数据
          sessionStorage.removeItem('boxList_' + this.$route.query.id)
          await this.initData()
        } catch (error) {
          console.error('删除箱规失败:', error)
          this.showError(error.message || '删除失败，请重试')
        } finally {
          this.hideLoading()
        }
      } else {
        // 如果没有id，说明是未保存的新箱子，直接从数组中删除
        this.boxList.splice(index, 1)
        this.saveBoxList()
        this.showSuccess('删除成功')
      }
    },
    continueBox(index) {
      sessionStorage.setItem('currentBoxIndex', index.toString())
      this.saveBoxList()
      this.$router.push({
        path: '/packing/box-detail',
        query: { id: this.$route.query.id, boxIndex: index }
      })
    },
    async handleConfirmPackaging() {
      const invalidBoxes = this.boxList.filter(box => {
        return !box.length || !box.width || !box.height || !box.boxNum || box.boxSizeItems.length === 0
      })

      if (invalidBoxes.length > 0) {
        this.showError('请完善所有箱规信息后再确认打包')
        return
      }

      // 计算计划发货总数
      const totalPlanQuantity = this.packingItem?.skus?.reduce((sum, sku) => sum + (sku.quantity || 0), 0) || 0

      this.showLoading()
      try {
        const params = [{
          id: this.$route.query.id,
          packagingDto: this.boxList.map(box => {
            // 计算当前箱规中所有SKU的实际发货数量总和
            const actualShipmentNum = box.boxSizeItems.reduce((sum, sku) => sum + (sku.shippedQuantity || 0), 0)

            return {
              id: box.id || '',
              useCount: totalPlanQuantity,
              actualShipmentNum: actualShipmentNum
            }
          })
        }]

        await confirmPackaging(params)
        this.showSuccess('打包成功')
        sessionStorage.removeItem('boxList_' + this.$route.query.id)
        sessionStorage.removeItem('packingItem')
        sessionStorage.setItem('refreshPackingList', 'true')
        this.$router.push('/packing/list')
      } catch (error) {
        console.error('确认打包失败:', error)
        this.showError(error.message || '确认打包失败，请重试')
      } finally {
        this.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
/* 头部新建按钮 */
.header-add-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* 操作按钮组 */
.box-actions {
  display: flex;
  gap: 4px;
}

.box-actions .el-button--text {
  padding: 4px 8px;
  color: #409eff;
}

.box-actions .delete-btn {
  color: #f56c6c;
}

.box-actions .delete-btn.is-disabled {
  color: #c0c4cc;
}

/* 箱规内容区域 */
.box-content {
  display: flex;
  padding: 12px 15px;
  gap: 12px;
  align-items: center;
  min-height: 60px;
}

/* 箱规图片预览 */
.box-image-preview {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
}

.box-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 箱规信息区域 */
.box-info-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.box-info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 1.5;
  flex-wrap: wrap;
}

.info-label {
  color: #909399;
  font-weight: 400;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
  font-weight: 500;
  margin-right: 8px;
}

/* 卡片信息行 */
.list-card-info {
  display: flex;
  justify-content: space-between;
  padding: 6px 15px;
  font-size: 13px;
  color: #666;
}

.list-card-info .info-item {
  flex: 1;
}

/* 卡片底部提示 */
.card-tip {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 15px;
  font-size: 12px;
  color: #909399;
  border-top: 1px dashed #ebeef5;
}

.card-tip i {
  margin-left: 4px;
  font-size: 12px;
}

/* 卡片点击效果 */
.list-card {
  cursor: pointer;
  transition: all 0.2s;
}

.list-card:active {
  transform: scale(0.99);
  background: #f9f9f9;
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

/* 列表容器 */
.list-container {
  padding-bottom: 80px;
}

/* 空状态按钮 */
.empty-state .el-button {
  margin-top: 15px;
}
</style>
