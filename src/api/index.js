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
  FBA_PURCHASE_ARRIVAL: '/api/app/products/productsellfoxpurchaseorder/fbapurchasearrival'
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
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
 * 调���FBA采购到货接口
 */
export async function fbaPurchaseArrival(params) {
  return request(API_PATHS.FBA_PURCHASE_ARRIVAL, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

export default {
  getPdaListPaged,
  getPurchaseOrderByNo,
  fbaPurchaseArrival
}
