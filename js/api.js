/**
 * API 服务层
 * 处理与后端的所有接口通信
 */
// 数据结构
    // objRequestData = {
    //     "skipCount": 0,
    //     "maxResultCount": 0,
    //     contentSearches:{
    //         searchType:0,//采购单号类型值
    //         content:''//采购单号内容
    //     }
    // }
    // objListData = {
    //         "totalCount": 0,
    //         "items": [
    //             {
    //                 "purchaseNo": "",
    //                 "status": {},
    //                 "belongsUserId": "",
    //                 "belongsUserName": "",
    //                 "purchaserName": "",
    //                 "items": [
    //                     {
    //                         "mainImage": "",
    //                         "sku": "",
    //                         "productName": "",
    //                         "shopName": "",
    //                         "fnsku": "",
    //                         "num": 0,
    //                         "arrivalNum": 0,
    //                         "abnormalNum": 0,
    //                         "id": ""
    //                     }
    //                 ],
    //                 "id": ""
    //             }
    //         ]
    //     }

    // objDetailsData={
    //     "purchaseNo": "",
    //     "status": {},
    //     "belongsUserId": "",
    //     "belongsUserName": "",
    //     "purchaserName": "",
    //     "items": [
    //         {
    //             "mainImage": "",
    //             "sku": "",
    //             "productName": "",
    //             "shopName": "",
    //             "fnsku": "",
    //             "num": 0,
    //             "arrivalNum": 0,
    //             "abnormalNum": 0,
    //             "id": ""
    //         }
    //     ],
    //     "id": ""
    // }
const API = {
    // API 基础路径 - 可根据实际环境修改
    BASE_URL: 'http://117.24.14.3:1012',//开发环境
    // BASE_URL: 'http://117.24.12.124:1012',//生产环境

    // 获取到货列表接口
    GET_PDA_LIST_PAGED: '/api/app/products/productsellfoxpurchaseorder/getpdalistpaged',

    // 扫码接口路径 - 根据采购单号获取采购单信息
    GET_PURCHASE_ORDER: '/api/app/products/productsellfoxpurchaseorder/getpurchaseorderbyno',

    // 到货接口路径
    FBA_PURCHASE_ARRIVAL: '/api/app/products/productsellfoxpurchaseorder/fbapurchasearrival',

    /**
     * 通用请求方法
     * @param {string} url - 请求URL
     * @param {object} options - 请求配置
     * @returns {Promise}
     */
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        // GET 请求不需要 body 和 Content-Type
        if (config.method.toUpperCase() === 'GET') {
            delete config.body;
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(this.BASE_URL + url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },

    /**
     * 获取到货列表（分页）
     * @param {object} params - 请求参数
     * @param {number} params.skipCount - 跳过条数
     * @param {number} params.maxResultCount - 每页条数
     * @param {object} params.contentSearches - 搜索条件
     * @returns {Promise} 列表数据
     */
    async getPdaListPaged(params) {
        return this.request(this.GET_PDA_LIST_PAGED, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    },

    /**
     * 根据采购单号获取采购单信息
     * @param {string} purchaseNo - 采购单号（扫码获得）
     * @returns {Promise} 采购单信息
     */
    async getPurchaseOrderByNo(purchaseNo) {
        if (!purchaseNo) {
            throw new Error('采购单号不能为空');
        }

        const url = `${this.GET_PURCHASE_ORDER}?purchaseNo=${encodeURIComponent(purchaseNo)}`;

        return this.request(url, {
            method: 'GET'
        });
    },

    /**
     * 调用FBA采购到货接口
     * @param {object} params - 到货参数
     * @param {string} params.purchaseId - 采购单ID
     * @param {string} params.wareHouseId - 仓库ID
     * @param {string} params.arrivalTime - 到货时间
     * @param {array} params.items - 到货商品列表
     * @returns {Promise} 接口响应
     */
    async fbaPurchaseArrival(params) {
        return this.request(this.FBA_PURCHASE_ARRIVAL, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    },

    /**
     * 模拟扫码接口 - 用于开发测试
     * @returns {Promise} 模拟的采购单数据
     */

    async mockScanQRCode() {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 返回模拟数据 - 符合 objData 数据结构
        return {
            purchaseNo: "PO2024012001",
            tradeId: "TRD20240120153025",
            alibabaOrderSource: "1688",
            purchaserValue: 15800.50,
            otherFee: 50.00,
            purchaserName: "XX贸易有限公司",
            warehouseName: "深圳仓库A区",
            supplierName: "广州优品电子科技有限公司",
            partyAName: "XX集团股份有限公司",
            status: { name: "处理中", value: 1 },
            arrivalStatus: { name: "部分到货", value: 2 },
            totalPurchase: 15800.50,
            shipFee: 120.00,
            totalArrivalNum: 85,
            totalNum: 100,
            totalAbnormalNum: 2,
            orderTime: "2024-01-18 14:30:25",
            firstArrivalTime: "2024-01-19 09:15:00",
            allArrivalTime: "",
            completeTime: "",
            isExpediting: true,
            purchaseRequisitionStatus: { name: "部分请款", value: 1 },
            purchasePaidStatus: { name: "待付款", value: 0 },
            logisticsCompanyName: "顺丰速运",
            logisticsCompanyCode: "SF",
            trackingNo: "SF1234567890123",
            remark: "请尽快发货，客户催单中。注意包装防损。",
            payTypeList: "银行转账,支付宝",
            requisitionAmount: 8000.00,
            noRequisitionAmount: 7800.50,
            currency: "CNY",
            currencyIcon: "¥",
            belongsUserId: "U001",
            belongsUserName: "张三",
            createUserName: "李四",
            updateUserName: "王五",
            isDeleted: false,
            deleterId: "",
            deletionTime: "",
            lastModificationTime: "2024-01-20 10:30:00",
            lastModifierId: "U002",
            creationTime: "2024-01-18 14:30:25",
            creatorId: "U001",
            id: "ORDER001",
            items: [
                {
                    purchaseOrderId: "PO2024012001",
                    sku: "SKU001-BLK-L",
                    categoryName: "电子产品",
                    brandName: "优品",
                    productName: "无线蓝牙耳机 降噪版 黑色",
                    mainImage: "https://via.placeholder.com/150",
                    shopId: 1001,
                    shopName: "优品官方旗舰店",
                    fnsku: "FNSKU001",
                    sellerSku: "SELLER-SKU-001",
                    num: 50,
                    waitNum: 10,
                    arrivalNum: 38,
                    abnormalNum: 2,
                    perPurchase: 89.00,
                    purchaseCost: 85.00,
                    totalPurchase: 4450.00,
                    expectArrivalTime: "2024-01-22",
                    arrivalTimeType: "标准",
                    isGift: false,
                    includeTax: true,
                    priceIncludeTax: 89.00,
                    taxAmount: 4.45,
                    remark: "",
                    abnormalType: {},
                    isCompleted: false,
                    id: "ITEM001"
                },
                {
                    purchaseOrderId: "PO2024012001",
                    sku: "SKU002-WHT-M",
                    categoryName: "电子产品",
                    brandName: "优品",
                    productName: "智能手环 运动版 白色",
                    mainImage: "https://via.placeholder.com/150",
                    shopId: 1001,
                    shopName: "优品官方旗舰店",
                    fnsku: "FNSKU002",
                    sellerSku: "SELLER-SKU-002",
                    num: 30,
                    waitNum: 5,
                    arrivalNum: 25,
                    abnormalNum: 0,
                    perPurchase: 199.00,
                    purchaseCost: 180.00,
                    totalPurchase: 5970.00,
                    expectArrivalTime: "2024-01-22",
                    arrivalTimeType: "标准",
                    isGift: false,
                    includeTax: true,
                    priceIncludeTax: 199.00,
                    taxAmount: 9.95,
                    remark: "",
                    abnormalType: {},
                    isCompleted: false,
                    id: "ITEM002"
                },
                {
                    purchaseOrderId: "PO2024012001",
                    sku: "SKU003-GRY-S",
                    categoryName: "配件",
                    brandName: "优品",
                    productName: "Type-C 数据线 1.5米 灰色",
                    mainImage: "https://via.placeholder.com/150",
                    shopId: 1001,
                    shopName: "优品官方旗舰店",
                    fnsku: "FNSKU003",
                    sellerSku: "SELLER-SKU-003",
                    num: 20,
                    waitNum: 0,
                    arrivalNum: 20,
                    abnormalNum: 0,
                    perPurchase: 25.00,
                    purchaseCost: 20.00,
                    totalPurchase: 500.00,
                    expectArrivalTime: "2024-01-21",
                    arrivalTimeType: "加急",
                    isGift: true,
                    includeTax: false,
                    priceIncludeTax: 0,
                    taxAmount: 0,
                    remark: "赠品",
                    abnormalType: {},
                    isCompleted: true,
                    id: "ITEM003"
                }
            ]
        };
    }
};

// 导出API对象供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
