/**
 * PDA扫码H5应用主逻辑
 */

(function() {
    'use strict';

    // 开发模式开关 - true使用模拟数据，false调用接口
    // 本地测试时设置为 true，部署到服务器时设置为 false
    const DEV_MODE = false;

    // 每页加载条数
    const PAGE_SIZE = 25;

    // DOM 元素缓存
    const elements = {
        // 页面
        homePage: document.getElementById('homePage'),
        listPage: document.getElementById('listPage'),
        detailPage: document.getElementById('detailPage'),

        // 首页元素
        arrivalMenuBtn: document.getElementById('arrivalMenuBtn'),

        // 列表页面元素
        listBackBtn: document.getElementById('listBackBtn'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        scanBtn: document.getElementById('scanBtn'),
        listContainer: document.getElementById('listContainer'),
        listContent: document.getElementById('listContent'),
        loadingMore: document.getElementById('loadingMore'),
        noMoreData: document.getElementById('noMoreData'),
        emptyList: document.getElementById('emptyList'),

        // 详情页面元素
        detailBackBtn: document.getElementById('detailBackBtn'),
        statusBadge: document.getElementById('statusBadge'),
        purchaseNo: document.getElementById('purchaseNo'),
        belongsUserName: document.getElementById('belongsUserName'),
        purchaserName: document.getElementById('purchaserName'),
        itemsList: document.getElementById('itemsList'),
        itemCount: document.getElementById('itemCount'),
        confirmArrivalBtn: document.getElementById('confirmArrivalBtn'),

        // 加载和提示
        loading: document.getElementById('loading'),
        errorToast: document.getElementById('errorToast'),
        errorMessage: document.getElementById('errorMessage'),
        successToast: document.getElementById('successToast'),
        successMessage: document.getElementById('successMessage')
    };

    // 状态管理
    let listData = [];           // 列表数据
    let currentPage = 0;         // 当前页码
    let totalCount = 0;          // 总数据条数
    let isLoadingMore = false;   // 是否正在加载更多
    let hasMoreData = true;      // 是否还有更多数据
    let searchKeyword = '';      // 搜索关键词
    let currentDetailData = null; // 当前详情数据
    let previousPage = 'home';   // 记录从哪个页面进入详情

    // 扫码器相关变量
    let html5QrCode = null;
    let scannerOverlay = null;
    let isScanning = false;

    // 防抖定时器
    let searchDebounceTimer = null;

    /**
     * 初始化应用
     */
    function init() {
        bindEvents();
        console.log('PDA扫码H5应用已初始化');
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 首页 - 到货菜单点击
        elements.arrivalMenuBtn.addEventListener('click', goToListPage);

        // 列表页 - 返回按钮
        elements.listBackBtn.addEventListener('click', goToHomePage);

        // 列表页 - 搜索输入
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        // 列表页 - 清除搜索
        elements.clearSearchBtn.addEventListener('click', clearSearch);

        // 列表页 - 扫码按钮
        elements.scanBtn.addEventListener('click', handleScan);

        // 列表页 - 滚动加载更多
        elements.listContainer.addEventListener('scroll', handleScroll);

        // 详情页 - 返回按钮
        elements.detailBackBtn.addEventListener('click', goBackFromDetail);

        // 详情页 - 确认到货按钮
        elements.confirmArrivalBtn.addEventListener('click', handleConfirmArrival);
    }

    // ==================== 页面导航 ====================

    /**
     * 显示指定页面
     */
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    /**
     * 返回首页
     */
    function goToHomePage() {
        showPage('homePage');
    }

    /**
     * 进入列表页面
     */
    async function goToListPage() {
        showPage('listPage');
        // 重置列表状态
        resetListState();
        // 加载第一页数据
        await loadListData();
    }

    /**
     * 进入详情页面
     */
    function goToDetailPage(data, fromPage = 'list') {
        previousPage = fromPage;
        currentDetailData = data;
        renderDetail(data);
        showPage('detailPage');
    }

    /**
     * 从详情页返回
     */
    function goBackFromDetail() {
        if (previousPage === 'list') {
            showPage('listPage');
        } else {
            showPage('homePage');
        }
    }

    // ==================== 列表功能 ====================

    /**
     * 重置列表状态
     */
    function resetListState() {
        listData = [];
        currentPage = 1;
        totalCount = 0;
        isLoadingMore = false;
        hasMoreData = true;
        searchKeyword = '';
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.add('hidden');
        elements.listContent.innerHTML = '';
        elements.noMoreData.classList.add('hidden');
        elements.emptyList.classList.add('hidden');
    }

    /**
     * 加载列表数据
     */
    async function loadListData(isLoadMore = false) {
        if (isLoadingMore) return;
        if (!hasMoreData && isLoadMore) return;

        isLoadingMore = true;

        if (isLoadMore) {
            elements.loadingMore.classList.remove('hidden');
        } else {
            showLoading();
        }

        try {
            const params = {
                skipCount: currentPage * PAGE_SIZE,
                maxResultCount: PAGE_SIZE
            };

            // 如果有搜索关键词
            if (searchKeyword) {
                params.contentSearches = {
                    searchType: 0,
                    content: searchKeyword
                };
            }

            let result;
            if (DEV_MODE) {
                result = await mockGetListData(params);
            } else {
                result = await API.getPdaListPaged(params);
            }

            totalCount = result.totalCount || 0;
            const items = result.items || [];

            if (isLoadMore) {
                listData = listData.concat(items);
            } else {
                listData = items;
            }

            // 判断是否还有更多数据
            hasMoreData = listData.length < totalCount;

            // 渲染列表
            renderList(isLoadMore);

            // 更新页码
            currentPage++;

        } catch (error) {
            console.error('加载列表失败:', error);
            showError('加载数据失败，请重试');
        } finally {
            isLoadingMore = false;
            if (isLoadMore) {
                elements.loadingMore.classList.add('hidden');
            } else {
                hideLoading();
            }
        }
    }

    /**
     * 渲染列表
     */
    function renderList(isAppend = false) {
        if (listData.length === 0) {
            elements.listContent.innerHTML = '';
            elements.emptyList.classList.remove('hidden');
            elements.noMoreData.classList.add('hidden');
            return;
        }

        elements.emptyList.classList.add('hidden');

        const startIndex = isAppend ? (currentPage * PAGE_SIZE) : 0;
        const itemsToRender = isAppend ? listData.slice(startIndex) : listData;

        const html = itemsToRender.map((item, idx) => {
            const index = isAppend ? startIndex + idx : idx;
            const statusClass = getStatusClass(item.status?.value);
            const statusName = item.status?.name || '未知';

            // 计算商品数量统计
            const totalNum = item.items?.reduce((sum, i) => sum + (i.num || 0), 0) || 0;
            const arrivalNum = item.items?.reduce((sum, i) => sum + (i.arrivalNum || 0), 0) || 0;
            const abnormalNum = item.items?.reduce((sum, i) => sum + (i.abnormalNum || 0), 0) || 0;

            return `
                <div class="list-card" data-index="${index}">
                    <div class="list-card-header">
                        <span class="purchase-no">${escapeHtml(item.purchaseNo) || '-'}</span>
                        <button class="detail-btn" data-index="${index}">详情</button>
                    </div>
                    <div class="list-card-body">
                        <div class="list-info-row">
                            <span class="list-label">状态</span>
                            <span class="status-badge ${statusClass}">${statusName}</span>
                        </div>
                        <div class="list-info-row">
                            <span class="list-label">归属人</span>
                            <span class="list-value">${escapeHtml(item.belongsUserName) || '-'}</span>
                        </div>
                        <div class="list-info-row">
                            <span class="list-label">采购方</span>
                            <span class="list-value">${escapeHtml(item.purchaserName) || '-'}</span>
                        </div>
                        <div class="list-stats">
                            <div class="stat-mini">
                                <span class="stat-num">${totalNum}</span>
                                <span class="stat-text">总数</span>
                            </div>
                            <div class="stat-mini success">
                                <span class="stat-num">${arrivalNum}</span>
                                <span class="stat-text">已到货</span>
                            </div>
                            <div class="stat-mini ${abnormalNum > 0 ? 'danger' : ''}">
                                <span class="stat-num">${abnormalNum}</span>
                                <span class="stat-text">异常</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (isAppend) {
            elements.listContent.insertAdjacentHTML('beforeend', html);
        } else {
            elements.listContent.innerHTML = html;
        }

        // 绑定详情按钮事件
        bindDetailButtons();

        // 更新加载更多状态
        if (!hasMoreData) {
            elements.noMoreData.classList.remove('hidden');
        } else {
            elements.noMoreData.classList.add('hidden');
        }
    }

    /**
     * 绑定详情按钮事件
     */
    function bindDetailButtons() {
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                const item = listData[index];
                if (item) {
                    showLoading();
                    try {
                        // 获取详情数据
                        let detailData;
                        if (DEV_MODE) {
                            detailData = await API.mockScanQRCode();
                        } else {
                            detailData = await API.getPurchaseOrderByNo(item.purchaseNo);
                        }
                        goToDetailPage(detailData, 'list');
                    } catch (error) {
                        console.error('获取详情失败:', error);
                        showError('获取详情失败，请重试');
                    } finally {
                        hideLoading();
                    }
                }
            });
        });
    }

    /**
     * 获取状态样式类名
     */
    function getStatusClass(value) {
        switch (value) {
            case 0: return 'pending';
            case 1: return 'processing';
            case 2: return 'completed';
            case 3: return 'cancelled';
            default: return 'processing';
        }
    }

    /**
     * 处理滚动加载更多
     */
    function handleScroll() {
        if (isLoadingMore || !hasMoreData) return;

        const container = elements.listContainer;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // 距离底部100px时开始加载
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadListData(true);
        }
    }

    /**
     * 处理搜索输入
     */
    function handleSearchInput(e) {
        const value = e.target.value.trim();

        // 显示/隐藏清除按钮
        if (value) {
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }

        // 防抖搜索
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            handleSearch();
        }, 500);
    }

    /**
     * 执行搜索
     */
    async function handleSearch() {
        const value = elements.searchInput.value.trim();
        searchKeyword = value;
        currentPage = 0;
        hasMoreData = true;
        listData = [];
        elements.listContent.innerHTML = '';
        elements.noMoreData.classList.add('hidden');
        await loadListData();
    }

    /**
     * 清除搜索
     */
    async function clearSearch() {
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.add('hidden');
        searchKeyword = '';
        currentPage = 0;
        hasMoreData = true;
        listData = [];
        elements.listContent.innerHTML = '';
        elements.noMoreData.classList.add('hidden');
        await loadListData();
    }

    // ==================== 扫码功能 ====================

    /**
     * 处理扫码
     */
    async function handleScan() {
        // 检查摄像头支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('当前浏览器不支持摄像头功能');
            return;
        }

        // 检查是否为安全上下文
        if (!window.isSecureContext) {
            showError('请使用 HTTPS 协议访问本页面以启用摄像头功能');
            return;
        }

        await startCameraScanning();
    }

    /**
     * 启动摄像头扫码
     */
    async function startCameraScanning() {
        if (isScanning) return;

        try {
            createScannerOverlay();
            isScanning = true;

            html5QrCode = new Html5Qrcode("scanner-video-container");

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.777778,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E
                ]
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                async (decodedText) => {
                    console.log('扫描到条码:', decodedText);
                    await closeScannerOverlay();
                    await fetchPurchaseOrderByNo(decodedText);
                },
                () => {}
            );

        } catch (error) {
            console.error('摄像头访问失败:', error);
            await closeScannerOverlay();

            if (error.name === 'NotAllowedError') {
                showError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
            } else if (error.name === 'NotFoundError') {
                showError('未找到摄像头设备');
            } else if (error.name === 'NotReadableError') {
                showError('摄像头被其他应用占用');
            } else {
                showError('无法启动摄像头扫码');
            }
        }
    }

    /**
     * 创建扫码界面
     */
    function createScannerOverlay() {
        scannerOverlay = document.createElement('div');
        scannerOverlay.className = 'scanner-overlay';
        scannerOverlay.innerHTML = `
            <div class="scanner-header">
                <button class="scanner-close-btn">&times;</button>
                <span>扫描条形码</span>
            </div>
            <div class="scanner-video-container" id="scanner-video-container">
            </div>
            <p class="scanner-tip">将条形码对准扫描框</p>
        `;

        document.body.appendChild(scannerOverlay);
        scannerOverlay.querySelector('.scanner-close-btn').addEventListener('click', closeScannerOverlay);
    }

    /**
     * 关闭扫码界面
     */
    async function closeScannerOverlay() {
        isScanning = false;

        if (html5QrCode) {
            try {
                const state = html5QrCode.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    await html5QrCode.stop();
                }
            } catch (e) {
                console.log('停止扫描器时出错:', e);
            }
            html5QrCode = null;
        }

        if (scannerOverlay) {
            scannerOverlay.remove();
            scannerOverlay = null;
        }
    }

    /**
     * 根据采购单号获取详情
     */
    async function fetchPurchaseOrderByNo(purchaseNo) {
        showLoading();

        try {
            let data;
            if (DEV_MODE) {
                data = await API.mockScanQRCode();
            } else {
                data = await API.getPurchaseOrderByNo(purchaseNo);
            }

            goToDetailPage(data, 'list');
        } catch (error) {
            showError('获取采购单信息失败，请重试');
            console.error('获取采购单信息错误:', error);
        } finally {
            hideLoading();
        }
    }

    // ==================== 详情页功能 ====================

    /**
     * 渲染详情页面
     */
    function renderDetail(data) {
        // 状态徽章
        renderStatus(data.status);

        // 基本信息
        setText('purchaseNo', data.purchaseNo);
        setText('belongsUserName', data.belongsUserName);
        setText('purchaserName', data.purchaserName);

        // 商品列表
        renderItems(data.items);
    }

    /**
     * 渲染状态徽章
     */
    function renderStatus(status) {
        if (!status || !status.name) {
            elements.statusBadge.textContent = '';
            elements.statusBadge.className = 'status-badge';
            return;
        }

        elements.statusBadge.textContent = status.name;
        elements.statusBadge.className = 'status-badge ' + getStatusClass(status.value);
    }

    /**
     * 渲染商品列表
     */
    function renderItems(items) {
        if (!items || items.length === 0) {
            elements.itemsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无商品信息</p></div>';
            elements.itemCount.textContent = '';
            return;
        }

        elements.itemCount.textContent = `共${items.length}件`;

        const html = items.map((item, index) => `
            <div class="item-card" data-index="${index}">
                <div class="item-card-header">
                    <img class="item-image" src="${item.mainImage || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2212%22%3E暂无图片%3C/text%3E%3C/svg%3E'}" alt="${item.productName || '商品图片'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2212%22%3E加载失败%3C/text%3E%3C/svg%3E'">
                    <div class="item-basic-info">
                        <div class="item-name">${escapeHtml(item.productName) || '-'}</div>
                        <div class="item-sku">SKU: ${escapeHtml(item.sku) || '-'}</div>
                        ${item.fnsku ? `<div class="item-sku">FNSKU: ${escapeHtml(item.fnsku)}</div>` : ''}
                        ${item.shopName ? `<div class="item-sku">店铺: ${escapeHtml(item.shopName)}</div>` : ''}
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-quantity-info">
                        <div class="quantity-row">
                            <span class="quantity-label">采购数量:</span>
                            <span class="quantity-value">${item.num || 0}</span>
                        </div>
                        <div class="quantity-row">
                            <span class="quantity-label">已到货:</span>
                            <span class="quantity-value success">${item.arrivalNum || 0}</span>
                        </div>
                        <div class="quantity-row">
                            <span class="quantity-label">待收货:</span>
                            <span class="quantity-value warning">${(item.num || 0) - (item.arrivalNum || 0)}</span>
                        </div>
                        <div class="quantity-row">
                            <span class="quantity-label">异常数:</span>
                            <span class="quantity-value ${(item.abnormalNum || 0) > 0 ? 'danger' : ''}">${item.abnormalNum || 0}</span>
                        </div>
                    </div>
                    <div class="item-arrival-input">
                        <div class="arrival-input-group">
                            <label>本次到货:</label>
                            <div class="number-input">
                                <button type="button" class="num-btn minus" data-index="${index}">-</button>
                                <input type="number" class="arrival-num-input" data-index="${index}" value="0" min="0" max="${(item.num || 0) - (item.arrivalNum || 0)}">
                                <button type="button" class="num-btn plus" data-index="${index}">+</button>
                            </div>
                        </div>
                        <div class="arrival-input-group">
                            <label>异常数量:</label>
                            <div class="number-input">
                                <button type="button" class="num-btn abnormal-minus" data-index="${index}">-</button>
                                <input type="number" class="abnormal-num-input" data-index="${index}" value="0" min="0">
                                <button type="button" class="num-btn abnormal-plus" data-index="${index}">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        elements.itemsList.innerHTML = html;
        bindQuantityButtons();
    }

    /**
     * 绑定数量按钮事件
     */
    function bindQuantityButtons() {
        // 到货数量减
        document.querySelectorAll('.num-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                const input = document.querySelector(`.arrival-num-input[data-index="${index}"]`);
                if (input && parseInt(input.value) > 0) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });

        // 到货数量加
        document.querySelectorAll('.num-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                const input = document.querySelector(`.arrival-num-input[data-index="${index}"]`);
                if (input) {
                    const max = parseInt(input.max) || 999;
                    if (parseInt(input.value) < max) {
                        input.value = parseInt(input.value) + 1;
                    }
                }
            });
        });

        // 异常数量减
        document.querySelectorAll('.num-btn.abnormal-minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                const input = document.querySelector(`.abnormal-num-input[data-index="${index}"]`);
                if (input && parseInt(input.value) > 0) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });

        // 异常数量加
        document.querySelectorAll('.num-btn.abnormal-plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                const input = document.querySelector(`.abnormal-num-input[data-index="${index}"]`);
                if (input) {
                    input.value = parseInt(input.value) + 1;
                }
            });
        });
    }

    /**
     * 处理确认到货
     */
    async function handleConfirmArrival() {
        if (!currentDetailData) {
            showError('没有采购单数据');
            return;
        }

        // 收集到货数据
        const arrivalItems = [];
        const itemCards = document.querySelectorAll('.item-card');

        itemCards.forEach((card, index) => {
            const arrivalNumInput = card.querySelector('.arrival-num-input');
            const abnormalNumInput = card.querySelector('.abnormal-num-input');

            const arrivalNum = parseInt(arrivalNumInput?.value) || 0;
            const abnormalNum = parseInt(abnormalNumInput?.value) || 0;

            if (arrivalNum > 0 || abnormalNum > 0) {
                const item = currentDetailData.items[index];
                arrivalItems.push({
                    itemId: item.id || '',
                    sku: item.sku || '',
                    arrivalNum: arrivalNum,
                    arrivalRemark: '',
                    abnormalNum: abnormalNum,
                    arrivalType: {},
                    isCompleted: arrivalNum >= ((item.num || 0) - (item.arrivalNum || 0))
                });
            }
        });

        if (arrivalItems.length === 0) {
            showError('请填写至少一件商品的到货数量');
            return;
        }

        showLoading();

        try {
            const params = {
                purchaseId: currentDetailData.id || currentDetailData.purchaseNo || '',
                wareHouseId: currentDetailData.warehouseId || '',
                arrivalTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                items: arrivalItems
            };

            if (DEV_MODE) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                showSuccess('到货确认成功');
            } else {
                await API.fbaPurchaseArrival(params);
                showSuccess('到货确认成功');
            }

            // 清空输入
            document.querySelectorAll('.arrival-num-input').forEach(input => input.value = '0');
            document.querySelectorAll('.abnormal-num-input').forEach(input => input.value = '0');

        } catch (error) {
            showError('到货确认失败，请重试');
            console.error('到货确认错误:', error);
        } finally {
            hideLoading();
        }
    }

    // ==================== 工具函数 ====================

    /**
     * 设置文本内容
     */
    function setText(id, text) {
        const element = elements[id];
        if (element) {
            element.textContent = text !== undefined && text !== null ? text : '-';
        }
    }

    /**
     * HTML转义
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 显示加载状态
     */
    function showLoading() {
        elements.loading.classList.remove('hidden');
    }

    /**
     * 隐藏加载状态
     */
    function hideLoading() {
        elements.loading.classList.add('hidden');
    }

    /**
     * 显示错误提示
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorToast.classList.remove('hidden');
        setTimeout(() => {
            elements.errorToast.classList.add('hidden');
        }, 3000);
    }

    /**
     * 显示成功提示
     */
    function showSuccess(message) {
        elements.successMessage.textContent = message;
        elements.successToast.classList.remove('hidden');
        setTimeout(() => {
            elements.successToast.classList.add('hidden');
        }, 3000);
    }

    /**
     * 模拟获取列表数据
     */
    async function mockGetListData(params) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockItems = [];
        const total = 68;
        const start = params.skipCount;
        const count = Math.min(params.maxResultCount, total - start);

        for (let i = 0; i < count; i++) {
            const idx = start + i + 1;
            mockItems.push({
                purchaseNo: `PO2024${String(idx).padStart(4, '0')}`,
                status: { name: ['待处理', '处理中', '已完成', '已取消'][idx % 4], value: idx % 4 },
                belongsUserId: `U${idx}`,
                belongsUserName: `用户${idx}`,
                purchaserName: `采购方${idx}`,
                items: [
                    {
                        mainImage: '',
                        sku: `SKU${idx}-001`,
                        productName: `测试商品${idx}`,
                        shopName: `店铺${idx}`,
                        fnsku: `FNSKU${idx}`,
                        num: 10 + idx,
                        arrivalNum: 5 + (idx % 5),
                        abnormalNum: idx % 3,
                        id: `ITEM${idx}-001`
                    }
                ],
                id: `ORDER${idx}`
            });
        }

        return {
            totalCount: total,
            items: mockItems
        };
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
