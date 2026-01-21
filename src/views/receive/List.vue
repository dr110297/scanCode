<template>
  <div class="page active">
    <div class="header">
      <button class="back-btn" @click="goBack">&lt; 返回</button>
      <h1>收货列表</h1>
    </div>

    <div class="result-container">
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>收货功能开发中...</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReceiveList',
  methods: {
    goBack() {
      this.$router.push('/')
    }
  }
}
</script>
