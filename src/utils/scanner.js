/**
 * 钉钉扫码工具
 * 统一封装钉钉扫码功能，供所有页面使用
 * 使用 dd.biz.util.scan API
 */

/**
 * 检查是否在钉钉环境中
 * @returns {boolean}
 */
export function isDingTalkEnv() {
  return window.dd && window.dd.biz && window.dd.biz.util && typeof window.dd.biz.util.scan === 'function'
}

/**
 * 调用钉钉扫码
 * @param {Object} options 配置选项
 * @param {string} options.type 扫码类型：'qrCode'(二维码) | 'barCode'(条形码) | 'all'(所有)
 * @returns {Promise<string>} 返回扫码结果
 */
export function scan(options = {}) {
  return new Promise((resolve, reject) => {
    const { type = 'all' } = options

    // 检查是否在钉钉环境中
    if (!isDingTalkEnv()) {
      reject(new Error('请在钉钉客户端中使用扫码功能'))
      return
    }

    // 调用钉钉扫码 API (dd.biz.util.scan)
    window.dd.biz.util.scan({
      type: type,
      onSuccess: (result) => {
        // result.text 是扫描结果
        if (result && result.text) {
          resolve(result.text)
        } else {
          reject(new Error('扫码结果为空'))
        }
      },
      onFail: (err) => {
        console.error('钉钉扫码失败:', err)
        reject(new Error(err.message || '扫码失败，请重试'))
      }
    })
  })
}

/**
 * 扫描条形码
 * @returns {Promise<string>}
 */
export function scanBarcode() {
  return scan({ type: 'barCode' })
}

/**
 * 扫描二维码
 * @returns {Promise<string>}
 */
export function scanQrcode() {
  return scan({ type: 'qrCode' })
}

/**
 * 扫描所有类型（条形码和二维码）
 * @returns {Promise<string>}
 */
export function scanAll() {
  return scan({ type: 'all' })
}

export default {
  isDingTalkEnv,
  scan,
  scanBarcode,
  scanQrcode,
  scanAll
}
