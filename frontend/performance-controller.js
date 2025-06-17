/**
 * 性能模式控制器
 * 提供自动和手动性能优化控制
 */

class PerformanceController {
    constructor() {
        this.isPerformanceModeEnabled = false;
        this.autoMode = true;
        this.performanceModeCSS = null;
        this.indicator = null;
        
        this.init();
    }
    
    init() {
        this.createPerformanceToggle();
        this.loadPerformanceModeCSS();
        this.detectAndOptimize();
    }
    
    // 创建性能模式切换按钮
    createPerformanceToggle() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'performance-toggle-container';
        toggleContainer.innerHTML = `
            <div class="performance-toggle">
                <button id="performanceToggleBtn" class="performance-btn" title="切换性能模式">
                    <span class="performance-icon">⚡</span>
                    <span class="performance-text">性能</span>
                </button>
                <div class="performance-dropdown" id="performanceDropdown">
                    <div class="performance-option">
                        <label>
                            <input type="radio" name="performanceMode" value="auto" checked>
                            <span>自动优化</span>
                            <small>根据设备性能自动调整</small>
                        </label>
                    </div>
                    <div class="performance-option">
                        <label>
                            <input type="radio" name="performanceMode" value="high">
                            <span>高质量模式</span>
                            <small>完整视觉效果，可能较卡</small>
                        </label>
                    </div>
                    <div class="performance-option">
                        <label>
                            <input type="radio" name="performanceMode" value="performance">
                            <span>流畅模式</span>
                            <small>简化效果，优先流畅度</small>
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .performance-toggle-container {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 1000;
            }
            
            .performance-toggle {
                position: relative;
            }
            
            .performance-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(0, 122, 255, 0.3);
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #374151;
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
            }
            
            .performance-btn:hover {
                background: rgba(255, 255, 255, 0.95);
                border-color: rgba(0, 122, 255, 0.5);
                transform: translateY(-1px);
            }
            
            .performance-icon {
                font-size: 16px;
            }
            
            .performance-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                min-width: 240px;
                display: none;
            }
            
            .performance-dropdown.show {
                display: block;
            }
            
            .performance-option {
                margin-bottom: 12px;
            }
            
            .performance-option:last-child {
                margin-bottom: 0;
            }
            
            .performance-option label {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: background 0.2s ease;
            }
            
            .performance-option label:hover {
                background: #f9fafb;
            }
            
            .performance-option input[type="radio"] {
                margin-top: 2px;
            }
            
            .performance-option span {
                font-weight: 500;
                color: #374151;
            }
            
            .performance-option small {
                display: block;
                color: #6b7280;
                font-size: 12px;
                margin-top: 2px;
            }
            
            @media (max-width: 768px) {
                .performance-toggle-container {
                    top: 70px;
                    right: 10px;
                }
                
                .performance-dropdown {
                    min-width: 200px;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toggleContainer);
        
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        const toggleBtn = document.getElementById('performanceToggleBtn');
        const dropdown = document.getElementById('performanceDropdown');
        const radioButtons = document.querySelectorAll('input[name="performanceMode"]');
        
        // 切换下拉菜单
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
        
        // 防止下拉菜单内部点击关闭
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 模式切换
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleModeChange(radio.value);
                dropdown.classList.remove('show');
            });
        });
    }
    
    // 处理模式切换
    handleModeChange(mode) {
        console.log('🎛️ 性能模式切换:', mode);
        
        switch (mode) {
            case 'auto':
                this.autoMode = true;
                this.detectAndOptimize();
                break;
            case 'high':
                this.autoMode = false;
                this.disablePerformanceMode();
                break;
            case 'performance':
                this.autoMode = false;
                this.enablePerformanceMode();
                break;
        }
    }
    
    // 加载性能模式CSS
    loadPerformanceModeCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'performance-mode.css';
        link.id = 'performance-mode-css';
        document.head.appendChild(link);
        this.performanceModeCSS = link;
    }
    
    // 自动检测并优化
    detectAndOptimize() {
        if (!this.autoMode) return;
        
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = navigator.hardwareConcurrency < 4 || isMobile;
        const hasSlowConnection = navigator.connection && navigator.connection.effectiveType && 
                                 ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);
        
        if (isLowEnd || hasSlowConnection) {
            console.log('🚀 检测到低端设备或慢速网络，自动启用性能模式');
            this.enablePerformanceMode();
        }
    }
    
    // 启用性能模式
    enablePerformanceMode() {
        if (this.isPerformanceModeEnabled) return;
        
        console.log('⚡ 启用性能优化模式');
        this.isPerformanceModeEnabled = true;
        
        // 添加性能模式类
        document.body.classList.add('performance-mode');
        
        // 显示性能模式指示器
        this.showPerformanceIndicator();
        
        // 通知粒子系统
        if (window.particleSystem) {
            window.particleSystem.enablePerformanceMode();
        }
        
        // 触发性能模式事件
        window.dispatchEvent(new CustomEvent('performanceModeEnabled'));
    }
    
    // 禁用性能模式
    disablePerformanceMode() {
        if (!this.isPerformanceModeEnabled) return;
        
        console.log('✨ 禁用性能优化模式');
        this.isPerformanceModeEnabled = false;
        
        // 移除性能模式类
        document.body.classList.remove('performance-mode');
        
        // 隐藏性能模式指示器
        this.hidePerformanceIndicator();
        
        // 通知粒子系统
        if (window.particleSystem) {
            window.particleSystem.disablePerformanceMode();
        }
        
        // 触发性能模式事件
        window.dispatchEvent(new CustomEvent('performanceModeDisabled'));
    }
    
    // 显示性能模式指示器
    showPerformanceIndicator() {
        if (this.indicator) return;
        
        this.indicator = document.createElement('div');
        this.indicator.className = 'performance-indicator';
        this.indicator.textContent = '⚡ 性能模式';
        document.body.appendChild(this.indicator);
    }
    
    // 隐藏性能模式指示器
    hidePerformanceIndicator() {
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
    }
}

// 初始化性能控制器
document.addEventListener('DOMContentLoaded', () => {
    window.performanceController = new PerformanceController();
});