<template>
  <div id="app">
    <transition name="slide" mode="out-in">
      <router-view />
    </transition>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="toast" @click="errorMessage = ''">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="toast toast-success" @click="successMessage = ''">
      <span>{{ successMessage }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      loading: false,
      errorMessage: '',
      successMessage: ''
    }
  },
  provide() {
    return {
      showLoading: this.showLoading,
      hideLoading: this.hideLoading,
      showError: this.showError,
      showSuccess: this.showSuccess
    }
  },
  methods: {
    showLoading() {
      this.loading = true
    },
    hideLoading() {
      this.loading = false
    },
    showError(message) {
      this.errorMessage = message
      setTimeout(() => {
        this.errorMessage = ''
      }, 3000)
    },
    showSuccess(message) {
      this.successMessage = message
      setTimeout(() => {
        this.successMessage = ''
      }, 3000)
    }
  }
}
</script>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
