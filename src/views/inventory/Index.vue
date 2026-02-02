<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>扫描盘点</h1>
    </div>

    <div class="inventory-container">
      <div class="page-title">
        <div class="title-icon">📋</div>
        <h2>请选择盘点方式</h2>
        <p class="subtitle">根据实际情况选择对应的盘点类型</p>
      </div>

      <div class="inventory-menu-grid">
        <button class="inventory-menu-item with-purchase" @click="goToWithPurchase">
          <div class="menu-item-content">
            <div class="menu-icon with-purchase-icon"></div>
            <div class="menu-text">
              <span class="menu-title">有采购单盘点</span>
              <span class="menu-desc">根据采购单进行盘点</span>
            </div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="inventory-menu-item without-purchase" @click="goToWithoutPurchase">
          <div class="menu-item-content">
            <div class="menu-icon without-purchase-icon"></div>
            <div class="menu-text">
              <span class="menu-title">无采购单盘点</span>
              <span class="menu-desc">直接选择商品进行盘点</span>
            </div>
          </div>
          <div class="menu-arrow">›</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryIndex',
  methods: {
    goBack() {
      this.$router.push('/')
    },
    goToWithPurchase() {
      this.$router.push('/inventory/list')
    },
    goToWithoutPurchase() {
      this.$router.push('/inventory/no-purchase-order')
    }
  }
}
</script>

<style scoped>
.inventory-container {
  padding: 20px 15px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px 0;
}

.title-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.page-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.inventory-menu-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.inventory-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #fff;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.inventory-menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.inventory-menu-item.with-purchase::before {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.inventory-menu-item.without-purchase::before {
  background: linear-gradient(180deg, #f093fb 0%, #f5576c 100%);
}

.inventory-menu-item:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.inventory-menu-item:hover:not(.disabled)::before {
  width: 100%;
  opacity: 0.05;
}

.inventory-menu-item:active:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.inventory-menu-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8f9fa;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.menu-icon {
  width: 56px;
  height: 56px;
  background-size: 32px 32px;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 12px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.inventory-menu-item:hover:not(.disabled) .menu-icon {
  transform: scale(1.1) rotate(5deg);
}

.menu-icon.with-purchase-icon {
  background-color: #e8eaf6;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23667eea'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z'/%3E%3C/svg%3E");
}

.menu-icon.without-purchase-icon {
  background-color: #fce4ec;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f5576c'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z'/%3E%3C/svg%3E");
}

.menu-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
}

.menu-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
}

.menu-desc {
  font-size: 13px;
  color: #95a5a6;
  line-height: 1.4;
}

.inventory-menu-item.disabled .menu-title {
  color: #95a5a6;
}

.menu-arrow {
  font-size: 32px;
  color: #bdc3c7;
  font-weight: 300;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.inventory-menu-item:hover:not(.disabled) .menu-arrow {
  color: #667eea;
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .inventory-container {
    padding: 15px 12px;
  }

  .page-title h2 {
    font-size: 20px;
  }

  .title-icon {
    font-size: 40px;
  }

  .inventory-menu-item {
    padding: 16px;
  }

  .menu-icon {
    width: 48px;
    height: 48px;
    background-size: 28px 28px;
  }

  .menu-title {
    font-size: 16px;
  }

  .menu-desc {
    font-size: 12px;
  }
}
</style>
