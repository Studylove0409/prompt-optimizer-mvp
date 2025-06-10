// API调用模块

// API 基础URL - 根据环境自动选择
const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'  // 本地开发环境
    : '/api';                      // 部署环境（相对路径）

// API调用的基础配置
const API_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000 // 30秒超时
};

// 通用API调用函数
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...API_CONFIG,
        ...options,
        headers: {
            ...API_CONFIG.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API调用失败 [${endpoint}]:`, error);
        throw error;
    }
}

// 优化提示词API调用
async function optimizePromptAPI(originalPrompt, model, mode = 'general') {
    const requestBody = {
        original_prompt: originalPrompt,
        model: model,
        mode: mode
    };
    
    console.log('发送的请求体:', requestBody);
    
    return await apiCall('/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
}

// 获取可用模型列表
async function getAvailableModelsAPI() {
    return await apiCall('/models');
}

// 健康检查API
async function healthCheckAPI() {
    return await apiCall('/health');
}

// 优化提示词的主要函数
async function optimizePrompt() {
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        throw new Error('没有输入提示词');
    }

    // 获取当前选择的模式
    const selectedMode = getSelectedMode();
    console.log('当前选择的模式:', selectedMode);
    
    // 显示加载状态
    showLoading();

    try {
        const data = await optimizePromptAPI(originalPrompt, selectedModel, selectedMode);

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
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const originalPrompt = originalPromptTextarea.value.trim();
    const quickModel = 'gemini-2.5-flash-preview-05-20'; // 使用Gemini Flash模型
    const selectedMode = getSelectedMode(); // 获取当前模式
    console.log('快速优化 - 当前选择的模式:', selectedMode);

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        throw new Error('没有输入提示词');
    }

    // 显示加载状态
    showLoading();

    try {
        const data = await optimizePromptAPI(originalPrompt, quickModel, selectedMode);

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
    const loadingIndicator = document.getElementById('loadingIndicator');
    const optimizeBtn = document.getElementById('optimizeBtn');
    
    // 使用紧凑型加载指示器
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // 禁用优化按钮
    if (optimizeBtn) {
        optimizeBtn.disabled = true;
    }
}

// 隐藏加载状态
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const optimizeBtn = document.getElementById('optimizeBtn');
    
    // 隐藏紧凑型加载指示器
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // 恢复按钮状态
    if (optimizeBtn) {
        optimizeBtn.disabled = false;
    }
}

// 显示结果
function showResult(optimizedPrompt, modelUsed) {
    const optimizedPromptDiv = document.getElementById('optimizedPrompt');
    const modelUsedDiv = document.getElementById('modelUsed');
    const outputSection = document.getElementById('outputSection');

    if (optimizedPromptDiv) {
        optimizedPromptDiv.textContent = optimizedPrompt;
    }
    
    if (modelUsedDiv) {
        modelUsedDiv.textContent = `使用模型: ${getModelDisplayName(modelUsed)}`;
    }
    
    if (outputSection) {
        outputSection.style.display = 'block';

        // 滚动到结果区域
        outputSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 复制结果到剪贴板
async function copyToClipboard() {
    const copyBtn = document.getElementById('copyBtn');
    const optimizedPromptDiv = document.getElementById('optimizedPrompt');
    
    if (!optimizedPromptDiv || !copyBtn) {
        return;
    }

    addButtonAnimation(copyBtn);

    const success = await copyTextToClipboard(optimizedPromptDiv.textContent);
    
    if (success) {
        showCopySuccess();
    } else {
        showCopyError();
    }
}

// 显示复制成功的UI更新
function showCopySuccess() {
    const copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) return;

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
}

// 显示复制失败的UI更新
function showCopyError() {
    const copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) return;

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

// 清空所有内容
function clearAll() {
    const clearBtn = document.getElementById('clearBtn');
    const originalPromptTextarea = document.getElementById('originalPrompt');
    const optimizedPromptDiv = document.getElementById('optimizedPrompt');
    const modelUsedDiv = document.getElementById('modelUsed');
    const outputSection = document.getElementById('outputSection');

    if (clearBtn) {
        addButtonAnimation(clearBtn);
    }

    // 添加确认对话框
    if ((originalPromptTextarea && originalPromptTextarea.value.trim()) || 
        (optimizedPromptDiv && optimizedPromptDiv.textContent.trim())) {
        showCustomConfirm('确定要清空所有内容吗？', () => {
            // 确认后清空内容
            if (originalPromptTextarea) originalPromptTextarea.value = '';
            if (optimizedPromptDiv) optimizedPromptDiv.textContent = '';
            if (modelUsedDiv) modelUsedDiv.textContent = '';
            if (outputSection) outputSection.style.display = 'none';

            updateCharCount();
            if (originalPromptTextarea) originalPromptTextarea.focus();

            // 显示成功提示
            showCustomAlert('已清空所有内容', 'success', 2000);

            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, null, '🧹');
    } else {
        // 如果没有内容，直接获取焦点
        if (originalPromptTextarea) originalPromptTextarea.focus();
    }
}

// 导出函数到全局作用域
window.optimizePrompt = optimizePrompt;
window.quickOptimizePrompt = quickOptimizePrompt;
window.copyToClipboard = copyToClipboard;
window.clearAll = clearAll;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showResult = showResult;
