<template>
  <div v-if="visible" class="image-preview-overlay" @click="handleClose">
    <div class="image-preview-header">
      <span v-if="total > 1">{{ currentIndex + 1 }} / {{ total }}</span>
      <button class="image-preview-close" @click="handleClose">&times;</button>
    </div>
    <div
      class="image-preview-content"
      @click.stop
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <button
        v-if="total > 1"
        class="image-preview-arrow prev"
        @click="prev"
      >&lt;</button>
      <img
        :src="currentImage"
        class="image-preview-img"
        @click.stop
      />
      <button
        v-if="total > 1"
        class="image-preview-arrow next"
        @click="next"
      >&gt;</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagePreview',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    images: {
      type: Array,
      default: () => []
    },
    startIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentIndex: 0,
      touchStartX: 0,
      touchEndX: 0
    }
  },
  computed: {
    total() {
      return this.images.length
    },
    currentImage() {
      return this.images[this.currentIndex] || ''
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.currentIndex = this.startIndex
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    },
    startIndex(val) {
      this.currentIndex = val
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--
      } else {
        this.currentIndex = this.total - 1
      }
    },
    next() {
      if (this.currentIndex < this.total - 1) {
        this.currentIndex++
      } else {
        this.currentIndex = 0
      }
    },
    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX
    },
    handleTouchMove(e) {
      this.touchEndX = e.touches[0].clientX
    },
    handleTouchEnd() {
      const diff = this.touchStartX - this.touchEndX
      const threshold = 50
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next()
        } else {
          this.prev()
        }
      }
      this.touchStartX = 0
      this.touchEndX = 0
    }
  },
  beforeDestroy() {
    document.body.style.overflow = ''
  }
}
</script>

<style scoped>
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.image-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  color: #fff;
  font-size: 16px;
}

.image-preview-close {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-close:active {
  background: rgba(255, 255, 255, 0.2);
}

.image-preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.image-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-preview-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-arrow:active {
  background: rgba(255, 255, 255, 0.2);
}

.image-preview-arrow.prev {
  left: 10px;
}

.image-preview-arrow.next {
  right: 10px;
}
</style>
