<template>
  <div class="page active">
    <div class="header">
      <h1>PDA扫码系统</h1>
    </div>
    <div class="home-container">
      <div class="menu-grid">
        <button class="menu-item" @click="goToList">
          <div class="menu-icon arrival-icon"></div>
          <span>到货</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()

    const goToList = () => {
      router.push('/list')
    }

    return {
      goToList
    }
  }
}
</script>
