<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

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
import { ref, provide } from 'vue'

export default {
  name: 'App',
  setup() {
    const loading = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')

    const showLoading = () => {
      loading.value = true
    }

    const hideLoading = () => {
      loading.value = false
    }

    const showError = (message) => {
      errorMessage.value = message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }

    const showSuccess = (message) => {
      successMessage.value = message
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }

    // 提供给子组件使用
    provide('showLoading', showLoading)
    provide('hideLoading', hideLoading)
    provide('showError', showError)
    provide('showSuccess', showSuccess)

    return {
      loading,
      errorMessage,
      successMessage
    }
  }
}
</script>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
