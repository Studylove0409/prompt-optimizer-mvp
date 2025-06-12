/**
 * 历史记录功能模块
 */

class HistoryManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.totalCount = 0;
        this.isLoading = false;

        // 日期筛选相关
        this.dateFilter = 'all'; // 'all', 'today', 'week', 'month', 'custom'
        this.startDate = null;
        this.endDate = null;

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.historyModal = document.getElementById('historyModal');
        this.historyButton = document.getElementById('historyButton');
        this.closeButton = document.getElementById('closeHistoryModal');
        this.historyLoading = document.getElementById('historyLoading');
        this.historyListContainer = document.getElementById('historyListContainer');
        this.historyEmpty = document.getElementById('historyEmpty');
        this.historyPagination = document.getElementById('historyPagination');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.paginationInfo = document.getElementById('paginationInfo');

        // 日期筛选相关元素
        this.dateFilterSelect = document.getElementById('dateFilterSelect');
        this.customDateRange = document.getElementById('customDateRange');
        this.startDateInput = document.getElementById('startDateInput');
        this.endDateInput = document.getElementById('endDateInput');
        this.applyDateFilterBtn = document.getElementById('applyDateFilterBtn');
    }

    bindEvents() {
        // 打开历史记录模态框
        if (this.historyButton) {
            this.historyButton.addEventListener('click', () => this.openHistoryModal());
        }

        // 关闭模态框
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeHistoryModal());
        }

        // 点击背景关闭模态框
        if (this.historyModal) {
            this.historyModal.addEventListener('click', (e) => {
                if (e.target === this.historyModal || e.target.classList.contains('history-modal-backdrop')) {
                    this.closeHistoryModal();
                }
            });
        }

        // 分页按钮
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => this.goToPreviousPage());
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => this.goToNextPage());
        }

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.historyModal.classList.contains('show')) {
                this.closeHistoryModal();
            }
        });

        // 日期筛选事件
        this.bindDateFilterEvents();

        // 复制按钮事件委托
        this.bindCopyEvents();
    }

    bindDateFilterEvents() {
        // 日期筛选下拉框事件
        if (this.dateFilterSelect) {
            this.dateFilterSelect.addEventListener('change', (e) => {
                this.dateFilter = e.target.value;
                if (this.dateFilter === 'custom') {
                    this.customDateRange.style.display = 'flex';
                } else {
                    this.customDateRange.style.display = 'none';
                    this.applyDateFilter();
                }
            });
        }

        // 应用自定义日期范围按钮
        if (this.applyDateFilterBtn) {
            this.applyDateFilterBtn.addEventListener('click', () => {
                this.applyDateFilter();
            });
        }

        // 日期输入框回车键应用筛选
        if (this.startDateInput) {
            this.startDateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyDateFilter();
                }
            });
        }

        if (this.endDateInput) {
            this.endDateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyDateFilter();
                }
            });
        }
    }

    bindCopyEvents() {
        // 使用事件委托处理复制按钮点击
        if (this.historyListContainer) {
            this.historyListContainer.addEventListener('click', (e) => {
                if (e.target.closest('.copy-btn')) {
                    const copyBtn = e.target.closest('.copy-btn');
                    const text = copyBtn.getAttribute('data-text');
                    if (text) {
                        this.copyToClipboard(text, copyBtn);
                    }
                }
            });
        }
    }

    async applyDateFilter() {
        // 设置日期范围
        this.setDateRange();

        // 重置到第一页
        this.currentPage = 1;

        // 重新加载数据
        await this.loadHistoryData();
    }

    setDateRange() {
        const now = new Date();

        switch (this.dateFilter) {
            case 'today':
                this.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                this.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'week':
                this.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                this.endDate = now;
                break;
            case 'month':
                this.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                this.endDate = now;
                break;
            case 'custom':
                if (this.startDateInput && this.endDateInput) {
                    this.startDate = this.startDateInput.value ? new Date(this.startDateInput.value) : null;
                    this.endDate = this.endDateInput.value ? new Date(this.endDateInput.value + 'T23:59:59') : null;
                }
                break;
            default:
                this.startDate = null;
                this.endDate = null;
        }
    }

    async openHistoryModal() {
        // 检查 Supabase 客户端是否可用
        if (!window.supabaseClient) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('认证服务暂时不可用，请刷新页面重试', 'error');
            } else {
                alert('认证服务暂时不可用，请刷新页面重试');
            }
            return;
        }

        // 检查用户是否已登录
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('请先登录以查看历史记录', 'warning');
            } else {
                alert('请先登录以查看历史记录');
            }
            return;
        }

        // 显示模态框
        this.historyModal.style.display = 'block';
        setTimeout(() => {
            this.historyModal.classList.add('show');
        }, 10);

        // 重置到第一页并加载数据
        this.currentPage = 1;
        await this.loadHistoryData();
    }

    closeHistoryModal() {
        this.historyModal.classList.remove('show');
        setTimeout(() => {
            this.historyModal.style.display = 'none';
        }, 300);
    }

    getBaseUrl() {
        // 检查当前是否在开发环境中
        if (window.location.protocol === 'file:') {
            // 如果是直接打开的HTML文件，使用localhost
            return 'http://localhost:8000';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // 如果是本地开发环境
            return `${window.location.protocol}//${window.location.host}`;
        } else {
            // 生产环境，使用当前域名
            return `${window.location.protocol}//${window.location.host}`;
        }
    }

    async getAccessToken() {
        try {
            // 使用全局的 supabaseClient 而不是 supabase
            if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();

                if (error) {
                    console.error('获取会话时出错:', error);
                    return null;
                }

                return session?.access_token;
            }
        } catch (error) {
            console.error('获取访问令牌失败:', error);
        }
        return null;
    }

    async loadHistoryData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                throw new Error('未找到访问令牌');
            }

            // 构建正确的API URL
            const baseUrl = this.getBaseUrl();
            let apiUrl = `${baseUrl}/api/history?page=${this.currentPage}&page_size=${this.pageSize}`;

            // 添加日期筛选参数
            if (this.startDate) {
                apiUrl += `&start_date=${this.startDate.toISOString()}`;
            }
            if (this.endDate) {
                apiUrl += `&end_date=${this.endDate.toISOString()}`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const historyData = await response.json();
            
            // 从响应头获取分页信息
            this.totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
            this.totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');

            this.renderHistoryList(historyData);
            this.updatePagination();

        } catch (error) {
            console.error('获取历史记录失败:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    showLoading() {
        this.historyLoading.style.display = 'block';
        this.historyListContainer.style.display = 'none';
        this.historyEmpty.style.display = 'none';
        this.historyPagination.style.display = 'none';
    }

    hideLoading() {
        this.historyLoading.style.display = 'none';
    }

    showError(message) {
        this.historyListContainer.innerHTML = `
            <div class="history-error">
                <div class="error-icon">⚠️</div>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="historyManager.loadHistoryData()">重试</button>
            </div>
        `;
        this.historyListContainer.style.display = 'block';
    }

    renderHistoryList(historyData) {
        if (!historyData || historyData.length === 0) {
            this.historyEmpty.style.display = 'block';
            this.historyListContainer.style.display = 'none';
            this.historyPagination.style.display = 'none';
            return;
        }

        this.historyEmpty.style.display = 'none';
        this.historyListContainer.style.display = 'block';
        this.historyPagination.style.display = this.totalPages > 1 ? 'flex' : 'none';

        // 清空容器
        this.historyListContainer.innerHTML = '';

        // 渲染每个历史记录
        historyData.forEach(item => {
            const card = this.createHistoryCard(item);
            this.historyListContainer.appendChild(card);
        });
    }

    createHistoryCard(item) {
        const card = document.createElement('div');
        card.className = 'history-card';

        const formattedDate = this.formatDate(item.created_at);
        const modeInfo = this.getModeInfo(item.mode);

        card.innerHTML = `
            <div class="history-card-header">
                <div class="history-meta">
                    <div class="history-mode">
                        <span>${modeInfo.icon}</span>
                        <span>${modeInfo.name}</span>
                    </div>
                    <div class="history-date">${formattedDate}</div>
                </div>
            </div>
            <div class="history-content">
                <div class="prompt-section">
                    <div class="prompt-label">
                        <strong>原始提示词</strong>
                        <button class="copy-btn" data-text="${this.escapeHtml(item.original_prompt)}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            复制
                        </button>
                    </div>
                    <div class="prompt-text original">${this.escapeHtml(item.original_prompt)}</div>
                </div>
                <div class="prompt-section">
                    <div class="prompt-label">
                        <strong>优化后的提示词</strong>
                        <button class="copy-btn" data-text="${this.escapeHtml(item.optimized_prompt)}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            复制
                        </button>
                    </div>
                    <div class="prompt-text optimized">${this.escapeHtml(item.optimized_prompt)}</div>
                </div>
            </div>
        `;

        return card;
    }

    getModeInfo(mode) {
        const modeMap = {
            'general': { name: '通用', icon: '🌟' },
            'business': { name: '商业', icon: '💼' },
            'drawing': { name: '绘画', icon: '🎨' },
            'academic': { name: '学术', icon: '📚' }
        };
        return modeMap[mode] || { name: '未知', icon: '❓' };
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '未知时间';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/'/g, '&#39;');
    }

    async copyToClipboard(text, buttonElement) {
        try {
            // 解码HTML实体
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            const decodedText = textarea.value;

            // 使用通用的复制函数
            let success = false;
            if (typeof copyTextToClipboard === 'function') {
                success = await copyTextToClipboard(decodedText);
            } else {
                // 备用方法
                await navigator.clipboard.writeText(decodedText);
                success = true;
            }

            if (success) {
                // 更新按钮状态
                const originalContent = buttonElement.innerHTML;
                buttonElement.classList.add('copied');
                buttonElement.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    已复制
                `;

                // 显示成功提示
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('已复制到剪贴板', 'success');
                }

                // 2秒后恢复按钮状态
                setTimeout(() => {
                    buttonElement.classList.remove('copied');
                    buttonElement.innerHTML = originalContent;
                }, 2000);
            } else {
                throw new Error('复制操作失败');
            }

        } catch (error) {
            console.error('复制失败:', error);
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('复制失败，请手动复制', 'error');
            } else {
                alert('复制失败，请手动复制');
            }
        }
    }

    updatePagination() {
        if (this.totalPages <= 1) {
            this.historyPagination.style.display = 'none';
            return;
        }

        this.historyPagination.style.display = 'flex';
        
        // 更新按钮状态
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;

        // 更新分页信息
        this.paginationInfo.textContent = `第 ${this.currentPage} 页，共 ${this.totalPages} 页`;
    }

    async goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadHistoryData();
        }
    }

    async goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.loadHistoryData();
        }
    }
}

// 初始化历史记录管理器
let historyManager;

// 初始化状态跟踪
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

// 等待DOM和Supabase都准备好后初始化
function initializeHistoryManager() {
    initializationAttempts++;

    // 如果已经初始化过，不要重复初始化
    if (historyManager) {
        return true;
    }

    // 检查是否超过最大尝试次数
    if (initializationAttempts > MAX_INIT_ATTEMPTS) {
        console.error('历史记录管理器初始化失败：超过最大尝试次数');
        return false;
    }

    // 检查DOM是否准备好
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHistoryManager, { once: true });
        return false;
    }

    // 检查必要的DOM元素是否存在
    const historyButton = document.getElementById('historyButton');
    const historyModal = document.getElementById('historyModal');

    if (!historyButton || !historyModal) {
        setTimeout(initializeHistoryManager, 500);
        return false;
    }

    // 检查Supabase客户端是否准备好
    if (!window.supabaseClient) {
        // 只添加一次事件监听器
        if (!window.historyManagerInitListenerAdded) {
            window.addEventListener('supabaseReady', initializeHistoryManager, { once: true });
            window.historyManagerInitListenerAdded = true;
        }

        // 设置重试机制
        setTimeout(initializeHistoryManager, 1000);
        return false;
    }

    try {
        // 创建历史记录管理器实例
        historyManager = new HistoryManager();
        // 导出给全局使用
        window.historyManager = historyManager;

        // 触发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('historyManagerReady'));

        return true;

    } catch (error) {
        console.error('历史记录管理器初始化失败:', error);

        // 如果是构造函数错误，延迟重试
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initializeHistoryManager, 1000);
        }

        return false;
    }
}

// 强制初始化函数（用于手动调用）
function forceInitializeHistoryManager() {
    initializationAttempts = 0;
    historyManager = null;
    window.historyManager = null;
    return initializeHistoryManager();
}

// 导出强制初始化函数到全局
window.forceInitializeHistoryManager = forceInitializeHistoryManager;

// 开始初始化
initializeHistoryManager();

// 页面完全加载后再次尝试初始化（备用方案）
window.addEventListener('load', () => {
    if (!historyManager) {
        setTimeout(initializeHistoryManager, 1000);
    }
});

// 额外的备用初始化（延迟5秒）
setTimeout(() => {
    if (!historyManager) {
        initializeHistoryManager();
    }
}, 5000);
