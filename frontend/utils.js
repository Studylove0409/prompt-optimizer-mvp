// 工具函数模块

// 创建自定义提示框
function showCustomAlert(message, type = 'info', duration = 3000) {
    // 移除现有的提示框
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    });

    // 创建提示框元素
    const alertBox = document.createElement('div');
    alertBox.className = `custom-alert ${type}`;
    
    // 根据类型设置图标
    let icon = '💬';
    if (type === 'error') icon = '😨';
    if (type === 'success') icon = '😊';
    if (type === 'warning') icon = '😯';
    if (type === 'info') icon = '🤓';
    
    alertBox.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${icon}</span>
            <span class="alert-message">${message}</span>
        </div>
        <button class="alert-close">×</button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertBox);
    
    // 显示动画
    setTimeout(() => {
        alertBox.classList.add('show');
    }, 10);
    
    // 关闭按钮事件
    const closeBtn = alertBox.querySelector('.alert-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            alertBox.classList.remove('show');
            setTimeout(() => {
                if (alertBox.parentNode) {
                    alertBox.parentNode.removeChild(alertBox);
                }
            }, 300);
        });
    }
    
    // 自动关闭
    if (duration > 0) {
        setTimeout(() => {
            if (alertBox.parentNode) {
                alertBox.classList.remove('show');
                setTimeout(() => {
                    if (alertBox.parentNode) {
                        alertBox.parentNode.removeChild(alertBox);
                    }
                }, 300);
            }
        }, duration);
    }
    
    return alertBox;
}

// 创建自定义确认对话框
function showCustomConfirm(message, onConfirm, onCancel, emoji = '🤔') {
    // 创建确认框元素
    const confirmBox = document.createElement('div');
    confirmBox.className = 'custom-confirm';
    
    confirmBox.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-message" data-emoji="${emoji}">${message}</div>
            <div class="confirm-buttons">
                <button class="confirm-button cancel">取消</button>
                <button class="confirm-button confirm">确认</button>
            </div>
        </div>
    `;
    
    // 添加背景遮罩
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    document.body.appendChild(overlay);
    
    // 添加到页面
    document.body.appendChild(confirmBox);
    
    // 显示动画
    setTimeout(() => {
        overlay.classList.add('show');
        confirmBox.classList.add('show');
    }, 10);
    
    // 按钮事件
    const cancelBtn = confirmBox.querySelector('.cancel');
    const confirmBtn = confirmBox.querySelector('.confirm');
    
    // 关闭确认框
    const closeConfirm = () => {
        confirmBox.classList.remove('show');
        overlay.classList.remove('show');
        
        setTimeout(() => {
            if (confirmBox.parentNode) confirmBox.parentNode.removeChild(confirmBox);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    };
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        closeConfirm();
        if (typeof onCancel === 'function') onCancel();
    });
    
    // 确认按钮事件
    confirmBtn.addEventListener('click', () => {
        closeConfirm();
        if (typeof onConfirm === 'function') onConfirm();
    });
    
    // ESC键关闭
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            closeConfirm();
            if (typeof onCancel === 'function') onCancel();
            document.removeEventListener('keydown', keyHandler);
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    // 点击背景关闭
    overlay.addEventListener('click', () => {
        closeConfirm();
        if (typeof onCancel === 'function') onCancel();
    });
}

// 获取选中的模型
function getSelectedModel() {
    const selectedRadio = document.querySelector('input[name="model"]:checked');
    return selectedRadio ? selectedRadio.value : 'deepseek-chat';
}

// 获取当前选择的模式
function getSelectedMode() {
    const activeModeBtn = document.querySelector('.mode-btn.active');
    return activeModeBtn ? activeModeBtn.dataset.mode : 'general';
}

// 获取模型显示名称
function getModelDisplayName(modelId) {
    const modelNames = {
        'deepseek-chat': '普通版',
        'gemini-2.0-flash': 'Pro版',
        'gemini-2.5-pro-preview-03-25': 'ULTRA版',
        'gemini-2.5-flash-preview-05-20': 'ULTRA版(旧)'
    };
    return modelNames[modelId] || modelId;
}

// 添加按钮点击动画
function addButtonAnimation(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

// 粒子迸发效果
function triggerParticleBurst(card) {
    // 检查是否已经选中，避免重复触发
    const radio = card.querySelector('input[type="radio"]');
    if (radio.checked) {
        return; // 如果已经选中，不触发效果
    }

    // 移除所有卡片的粒子效果类
    document.querySelectorAll('.model-card').forEach(c => {
        c.classList.remove('particle-burst');
    });

    // 添加粒子迸发效果
    card.classList.add('particle-burst');

    // 0.8秒后移除效果类，准备下次使用
    setTimeout(() => {
        card.classList.remove('particle-burst');
    }, 800);

    // 同时触发主粒子系统的交互效果
    if (window.particleSystem) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2 + window.scrollY;

        // 创建临时的强化粒子效果
        setTimeout(() => {
            createTemporaryParticles(centerX, centerY);
        }, 100);
    }
}

// 创建临时粒子效果
function createTemporaryParticles(x, y) {
    if (!window.particleSystem) return;

    // 创建柔和的临时粒子效果
    const tempParticles = [];
    const particleCount = 5;

    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const speed = 0.8 + Math.random() * 1.2;

        tempParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02,
            size: 1.5 + Math.random() * 1,
            color: `rgba(0, 122, 255, ${0.6 + Math.random() * 0.4})`
        });
    }

    // 将临时粒子添加到主粒子系统中进行渲染
    if (window.particleSystem.tempParticles) {
        window.particleSystem.tempParticles.push(...tempParticles);
    } else {
        window.particleSystem.tempParticles = tempParticles;
    }
}

// 复制到剪贴板的通用函数
async function copyTextToClipboard(text) {
    try {
        // 尝试使用现代Clipboard API
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Clipboard API 失败:', error);
        
        // 尝试使用备用方法 - execCommand
        try {
            // 创建临时选区和输入元素
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // 设置样式使其不可见
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.style.opacity = '0';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            // 尝试执行复制命令
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        } catch (fallbackError) {
            console.error('备用复制方法失败:', fallbackError);
            return false;
        }
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 导出函数到全局作用域
window.showCustomAlert = showCustomAlert;
window.showCustomConfirm = showCustomConfirm;
window.getSelectedModel = getSelectedModel;
window.getSelectedMode = getSelectedMode;
window.getModelDisplayName = getModelDisplayName;
window.addButtonAnimation = addButtonAnimation;
window.triggerParticleBurst = triggerParticleBurst;
window.createTemporaryParticles = createTemporaryParticles;
window.copyTextToClipboard = copyTextToClipboard;
window.debounce = debounce;
window.throttle = throttle;
