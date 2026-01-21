<template>
  <div class="page active">
    <div class="header">
      <h1>PDA扫码系统</h1>
    </div>
    <div class="home-container">
      <div class="menu-grid">
        <button class="menu-item" @click="goToArrival">
          <div class="menu-icon arrival-icon"></div>
          <span>到货</span>
        </button>
        <!-- <button class="menu-item" @click="goToReceive">
          <div class="menu-icon receive-icon"></div>
          <span>收货</span>
        </button> -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    goToArrival() {
      this.$router.push('/arrival/list')
    },
    goToReceive() {
      this.$router.push('/receive/list')
    }
  }
}
</script>

<style scoped>
.menu-icon.receive-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2352c41a'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E");
}
</style>
