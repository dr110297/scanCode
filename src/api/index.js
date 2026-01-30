/**
 * API 服务层
 * 处理与后端的所有接口通信
 */

// 从环境变量获取API基础路径
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// API 路径
const API_PATHS = {
  GET_PDA_LIST_PAGED: '/api/app/products/productsellfoxpurchaseorder/getpdalistpaged',
  GET_PURCHASE_ORDER: '/api/app/products/productsellfoxpurchaseorder/getpurchaseorderbyno',
  FBA_PURCHASE_ARRIVAL: '/api/app/products/productsellfoxpurchaseorder/fbapurchasearrival',
  GET_DING_USER_INFO: '/api/app/users/user/getdingusersinfo',
  GET_GOODS_LOCATION_ALL: '/api/app/chains/chaingoodslocation/getall',
  GET_DESIGNATED_STATUS_DATA: '/api/app/chains/chainshipplan/getdesignatedstatusdata',
  CONFIRM_ALLOCATED: '/api/app/chains/chainshipplan/confirmallocated',
  CONFIRM_PACKAGING: '/api/app/chains/chainshipplan/confirmpackaging',
  GET_PLAN_BOX_SIZE: '/api/app/chains/chainshipplan/getplanboxsize',
  CREATE_BOX_SIZE: '/api/app/chains/chainshipplan/createboxsize',
  MODIFY_BOX_SIZE: '/api/app/chains/chainshipplan/pdamodifyboxsize',
  REMOVE_BOX_SIZE: '/api/app/chains/chainshipplan/removeboxsize',
  UPLOAD_IMAGES: '/api/app/chains/chainshipplan/uploadimages'
}

/**
 * 通用请求方法
 */
async function request(url, options = {}) {
  const defaultOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const config = { ...defaultOptions, ...options }

  if (config.method.toUpperCase() === 'GET') {
    delete config.body
    delete config.headers['Content-Type']
  }

  try {
    const response = await fetch(BASE_URL + url, config)

    // 处理空响应或获取响应文本
    const text = await response.text()

    if (!response.ok) {
      // 尝试解析错误响应体
      let errorData = null
      try {
        errorData = text ? JSON.parse(text) : null
      } catch (e) {
        // 解析失败，使用原始文本
      }
      console.log(errorData)
      // 如果响应体中有code字段，优先使用
      if (errorData.error && errorData.error.code) {
        throw new Error(errorData.error.code)
      } else if (errorData.error && errorData.error.message) {
        throw new Error(errorData.error.message)
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }

    // 处理成功响应
    if (!text) {
      return { success: true }
    }
    return JSON.parse(text)
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * 获取到货列表（分页）
 */
export async function getPdaListPaged(params) {
  return request(API_PATHS.GET_PDA_LIST_PAGED, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 根据采购单号获取采购单信息
 */
export async function getPurchaseOrderByNo(purchaseNo) {
  if (!purchaseNo) {
    throw new Error('采购单号不能为空')
  }

  const url = `${API_PATHS.GET_PURCHASE_ORDER}?purchaseNo=${encodeURIComponent(purchaseNo)}`
  return request(url, { method: 'GET' })
}

/**
 * 调用FBA采购到货接口
 */
export async function fbaPurchaseArrival(params) {
  return request(API_PATHS.FBA_PURCHASE_ARRIVAL, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 获取钉钉用户信息
 */
export async function getDingUserInfo(code) {
  if (!code) {
    throw new Error('免登code不能为空')
  }
  const url = `${API_PATHS.GET_DING_USER_INFO}?code=${encodeURIComponent(code)}`
  return request(url, { method: 'GET' })
}

/**
 * 获取所有货位列表
 */
export async function getGoodsLocationAll() {
  return request(API_PATHS.GET_GOODS_LOCATION_ALL, {
    method: 'POST'
  })
}

/**
 * 获取指定状态的发货计划数据（配货/打包）
 */
export async function getDesignatedStatusData(params) {
  return request(API_PATHS.GET_DESIGNATED_STATUS_DATA, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 确认配货
 */
export async function confirmAllocated(ids) {
  return request(API_PATHS.CONFIRM_ALLOCATED, {
    method: 'POST',
    body: JSON.stringify(ids)
  })
}

/**
 * 确认打包
 */
export async function confirmPackaging(params) {
  return request(API_PATHS.CONFIRM_PACKAGING, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 获取箱规列表
 */
export async function getPlanBoxSize(id) {
  const url = `${API_PATHS.GET_PLAN_BOX_SIZE}?id=${encodeURIComponent(id)}`
  return request(url, { method: 'GET' })
}

/**
 * 创建箱规
 */
export async function createBoxSize(params) {
  return request(API_PATHS.CREATE_BOX_SIZE, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 修改箱规
 */
export async function modifyBoxSize(params) {
  return request(API_PATHS.MODIFY_BOX_SIZE, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 删除箱规
 */
export async function removeBoxSize(id) {
  const url = `${API_PATHS.REMOVE_BOX_SIZE}?id=${encodeURIComponent(id)}`
  return request(url, { method: 'GET' })
}

/**
 * 上传图片
 */
export async function uploadImages(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(BASE_URL + API_PATHS.UPLOAD_IMAGES, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error('图片上传失败')
  }

  const text = await response.text()
  return text ? JSON.parse(text) : { success: true }
}

export default {
  getPdaListPaged,
  getPurchaseOrderByNo,
  fbaPurchaseArrival,
  getDingUserInfo,
  getGoodsLocationAll,
  getDesignatedStatusData,
  confirmAllocated,
  confirmPackaging,
  getPlanBoxSize,
  createBoxSize,
  modifyBoxSize,
  removeBoxSize,
  uploadImages
}
