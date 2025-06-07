// DOM 元素
const originalPromptTextarea = document.getElementById('originalPrompt');
const optimizeBtn = document.getElementById('optimizeBtn');
const outputSection = document.getElementById('outputSection');
const optimizedPromptDiv = document.getElementById('optimizedPrompt');
const modelUsedDiv = document.getElementById('modelUsed');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const loadingIndicator = document.getElementById('loadingIndicator');

// 新增元素
const charCountElement = document.querySelector('.char-count');

// API 基础URL - 根据环境自动选择
const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'  // 本地开发环境
    : '/api';                      // 部署环境（相对路径）

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

// 更新字符计数
function updateCharCount() {
    const text = originalPromptTextarea.value;
    const count = text.length;
    if (charCountElement) {
        charCountElement.textContent = `${count} 字符`;
    }

    // 当有内容时，给按钮添加脉冲提示
    if (count > 0 && !optimizeBtn.classList.contains('pulse-hint')) {
        optimizeBtn.classList.add('pulse-hint');
    } else if (count === 0) {
        optimizeBtn.classList.remove('pulse-hint');
    }
}

// 添加按钮点击动画
function addButtonAnimation(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

// 优化提示词
async function optimizePrompt() {
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        throw new Error('没有输入提示词');
    }

    // 显示加载状态
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_prompt: originalPrompt,
                model: selectedModel
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 显示结果
        showResult(data.optimized_prompt, data.model_used);

        // 显示成功提示
        showCustomAlert('提示词优化成功！', 'success', 2000);

        return data; // 返回结果数据

    } catch (error) {
        console.error('优化失败:', error);
        showCustomAlert('优化失败，请检查网络连接或稍后重试', 'error', 3500);
        throw error; // 重新抛出错误以便调用者处理
    } finally {
        hideLoading();
    }
}

// 快速优化提示词 (使用Gemini Flash模型)
async function quickOptimizePrompt() {
    const originalPrompt = originalPromptTextarea.value.trim();
    const quickModel = 'gemini-2.5-flash-preview-05-20'; // 使用Gemini Flash模型

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        throw new Error('没有输入提示词');
    }

    // 显示加载状态
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_prompt: originalPrompt,
                model: quickModel
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 显示结果
        showResult(data.optimized_prompt, data.model_used);

        // 显示成功提示（标明是快速优化）
        showCustomAlert('快速优化成功！', 'success', 2000);

        return data; // 返回结果数据

    } catch (error) {
        console.error('快速优化失败:', error);
        showCustomAlert('快速优化失败，请检查网络连接或稍后重试', 'error', 3500);
        throw error; // 重新抛出错误以便调用者处理
    } finally {
        hideLoading();
    }
}

// 显示加载状态
function showLoading() {
    // 使用紧凑型加载指示器
    loadingIndicator.style.display = 'block';
    
    // 禁用优化按钮
    optimizeBtn.disabled = true;
}

// 隐藏加载状态
function hideLoading() {
    // 隐藏紧凑型加载指示器
    loadingIndicator.style.display = 'none';
    
    // 恢复按钮状态
    optimizeBtn.disabled = false;
}

// 显示结果
function showResult(optimizedPrompt, modelUsed) {
    optimizedPromptDiv.textContent = optimizedPrompt;
    modelUsedDiv.textContent = `使用模型: ${getModelDisplayName(modelUsed)}`;
    outputSection.style.display = 'block';

    // 滚动到结果区域
    outputSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 复制结果到剪贴板
async function copyToClipboard() {
    addButtonAnimation(copyBtn);

    try {
        await navigator.clipboard.writeText(optimizedPromptDiv.textContent);

        // 临时改变按钮文本以显示成功
        const originalIcon = copyBtn.querySelector('.button-icon').textContent;
        const originalText = copyBtn.querySelector('.button-text').textContent;

        copyBtn.querySelector('.button-icon').textContent = '✅';
        copyBtn.querySelector('.button-text').textContent = '已复制!';
        copyBtn.style.background = 'var(--color-success)';
        copyBtn.style.borderColor = 'var(--color-success)';
        copyBtn.style.color = 'white';

        // 显示复制成功提示框
        showCustomAlert('提示词已成功复制到剪贴板', 'success', 2000);

        setTimeout(() => {
            copyBtn.querySelector('.button-icon').textContent = originalIcon;
            copyBtn.querySelector('.button-text').textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
        }, 2000);

    } catch (error) {
        console.error('复制失败:', error);

        // 显示错误状态
        const originalIcon = copyBtn.querySelector('.button-icon').textContent;
        copyBtn.querySelector('.button-icon').textContent = '❌';
        copyBtn.style.background = 'var(--color-error)';
        copyBtn.style.borderColor = 'var(--color-error)';
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.querySelector('.button-icon').textContent = originalIcon;
            copyBtn.style.background = '';
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
        }, 2000);

        showCustomAlert('复制失败，请手动选择文本复制', 'error', 3500);
    }
}

// 清空所有内容
function clearAll() {
    addButtonAnimation(clearBtn);

    // 添加确认对话框
    if (originalPromptTextarea.value.trim() || optimizedPromptDiv.textContent.trim()) {
        showCustomConfirm('确定要清空所有内容吗？', () => {
            // 确认后清空内容
            originalPromptTextarea.value = '';
            optimizedPromptDiv.textContent = '';
            modelUsedDiv.textContent = '';
            outputSection.style.display = 'none';
            updateCharCount();
            originalPromptTextarea.focus();
            
            // 显示成功提示
            showCustomAlert('已清空所有内容', 'success', 2000);

            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, null, '🧹');
    } else {
        // 如果没有内容，直接获取焦点
        originalPromptTextarea.focus();
    }
}

// 增强模型卡片交互效果
function enhanceModelCards() {
    const modelCards = document.querySelectorAll('.model-card');
    
    // 添加卡片悬停音效和动画效果
    modelCards.forEach(card => {
        // 卡片选中效果
        card.addEventListener('click', function() {
            // 移除所有卡片的粒子效果类
            modelCards.forEach(c => c.classList.remove('particle-burst'));
            
            // 为当前点击的卡片添加粒子效果
            this.classList.add('particle-burst');
            
            // 3D倾斜效果重置
            modelCards.forEach(c => {
                c.style.transform = '';
            });
        });
        
        // 3D倾斜效果 (鼠标移动时)
        card.addEventListener('mousemove', function(e) {
            // 仅在非移动设备上应用3D效果
            if (window.innerWidth <= 768) return;
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // 鼠标在卡片上的X位置
            const y = e.clientY - rect.top;  // 鼠标在卡片上的Y位置
            
            // 计算旋转角度 (最大±5度)
            const xDeg = (y / rect.height - 0.5) * -8; 
            const yDeg = (x / rect.width - 0.5) * 8;
            
            // 应用3D变换
            this.style.transform = `perspective(800px) rotateX(${xDeg}deg) rotateY(${yDeg}deg) translateY(-6px) scale(1.02)`;
        });
        
        // 鼠标移出时重置卡片状态
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// 事件监听器
optimizeBtn.addEventListener('click', () => {
    optimizeBtn.classList.remove('pulse-hint');
    addButtonAnimation(optimizeBtn);
    optimizePrompt();
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// 字符计数更新
originalPromptTextarea.addEventListener('input', updateCharCount);

// 键盘事件处理
originalPromptTextarea.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 快速优化 (使用Gemini Flash模型)
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        optimizeBtn.classList.remove('pulse-hint');
        addButtonAnimation(optimizeBtn);
        quickOptimizePrompt();
    }
    // Enter: 普通优化 (使用当前选择的模型)
    else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        optimizeBtn.classList.remove('pulse-hint');
        addButtonAnimation(optimizeBtn);
        optimizePrompt();
    }
    // Shift + Enter: 换行 (默认行为)
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    originalPromptTextarea.focus();
    updateCharCount();
    enhanceModelCards();

    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
