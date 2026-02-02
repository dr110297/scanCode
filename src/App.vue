<template>
  <div id="app">
    <!-- 登录验证遮罩 -->
    <div v-if="!isAuthenticated" class="auth-overlay">
      <div class="auth-box">
        <div v-if="authLoading" class="auth-loading">
          <div class="loading-spinner"></div>
          <p>正在验证登录...</p>
        </div>
        <div v-else class="auth-error">
          <p class="auth-error-icon">!</p>
          <p class="auth-error-title">无法访问</p>
          <p class="auth-error-msg">{{ authErrorMsg }}</p>
          <button class="auth-retry-btn" @click="initDingTalkLogin">重试</button>
        </div>
      </div>
    </div>

    <!-- 已登录内容 -->
    <template v-if="isAuthenticated">
      <!-- 顶部用户信息 -->
      <div class="user-header">
        <span class="user-name">{{ userName }}</span>
      </div>

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
    </template>
  </div>
</template>

<script>
import { getDingUserInfo, getGoodsLocationAll } from './api/index.js'

export default {
  name: 'App',
  data() {
    return {
      loading: false,
      errorMessage: '',
      successMessage: '',
      userName: '',
      isAuthenticated: true,
      authLoading: true,
      authErrorMsg: '',
      goodsLocationList: []
    }
  },
  provide() {
    return {
      showLoading: this.showLoading,
      hideLoading: this.hideLoading,
      showError: this.showError,
      showSuccess: this.showSuccess,
      getGoodsLocationList: () => this.goodsLocationList
    }
  },
  mounted() {
    this.initDingTalkLogin()
    this.loadGoodsLocationList()
  },
  methods: {
    initDingTalkLogin() {
      this.authLoading = true
      this.authErrorMsg = ''

      // 通过 userAgent 判断是否在钉钉客户端中
      // const isDingTalk = /DingTalk/i.test(navigator.userAgent)
      // if (!isDingTalk) {
      //   this.authLoading = false
      //   this.authErrorMsg = '请从钉钉客户端打开此页面'
      //   return
      // }

      dd.ready(() => {
        dd.runtime.permission.requestAuthCode({
          corpId: 'ding06bbd66b633a5a7a35c2f4657eb6378f',
          onSuccess: async (res) => {
            try {
              const userInfo = await getDingUserInfo(res.code)
              const name = userInfo.name
              if (name) {
                this.userName = name
                this.isAuthenticated = true
              } else {
                this.authErrorMsg = '获取用户信息失败，请重试'
              }
            } catch (error) {
              console.error('获取用户信息失败:', error)
              this.authErrorMsg = '获取用户信息失败，请重试'
            }
            this.authLoading = false
          },
          onFail: (err) => {
            console.error('钉钉免登失败:', err)
            this.authLoading = false
            this.authErrorMsg = '钉钉登录失败，请重试'
          }
        })
      })
    },
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
    },
    async loadGoodsLocationList() {
      try {
        const res = await getGoodsLocationAll()
        if (res && res.items) {
          this.goodsLocationList = res.items
        } else if (Array.isArray(res)) {
          this.goodsLocationList = res
        }
      } catch (error) {
        console.error('获取货位列表失败:', error)
      }
    }
  }
}
</script>

<style>
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-box {
  background: #fff;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  width: 90%;
}

.auth-loading p {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.auth-error-icon {
  width: 50px;
  height: 50px;
  line-height: 50px;
  border-radius: 50%;
  background: #ff4d4f;
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  margin: 0 auto 16px;
}

.auth-error-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.auth-error-msg {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.auth-retry-btn {
  background: #1890ff;
  color: #fff;
  border: none;
  padding: 10px 32px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.auth-retry-btn:active {
  background: #096dd9;
}

.user-header {
  position: fixed;
  top: 0;
  right: 0;
  padding: 16px 12px;
  z-index: 1000;
  /* background: rgba(255, 255, 255, 0.9); */
  border-bottom-left-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-name {
  font-size: 14px;
   color: white;
  font-weight: 500;
}

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
