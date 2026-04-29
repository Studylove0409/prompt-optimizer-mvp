// API调用模块

// API 基础URL - 根据环境自动选择
const API_BASE_URL = (() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isFileProtocol = window.location.protocol === 'file:';

    console.log('当前环境检测:');
    console.log('- hostname:', window.location.hostname);
    console.log('- protocol:', window.location.protocol);
    console.log('- isLocalhost:', isLocalhost);
    console.log('- isFileProtocol:', isFileProtocol);

    if (isLocalhost || isFileProtocol) {
        console.log('使用本地开发环境API: http://localhost:8000/api');
        return 'http://localhost:8000/api';
    } else {
        console.log('使用部署环境API: /api');
        return '/api';
    }
})();

// API调用的基础配置
const API_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000 // 120秒超时（2分钟）
};

const AUTH_SESSION_TIMEOUT_MS = 800;

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('获取认证令牌超时')), timeoutMs);
        })
    ]);
}

// 获取当前用户的认证令牌
async function getAuthToken() {
    if (!window.supabaseClient) {
        return null;
    }

    try {
        const { data: { session }, error } = await withTimeout(
            window.supabaseClient.auth.getSession(),
            AUTH_SESSION_TIMEOUT_MS
        );
        if (error || !session) {
            return null;
        }
        return session.access_token;
    } catch (error) {
        console.warn('获取认证令牌失败，继续使用匿名请求:', error.message || error);
        return null;
    }
}

// 通用API调用函数
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('完整请求URL:', url);

    // 获取认证令牌
    const token = await getAuthToken();

    const config = {
        ...API_CONFIG,
        ...options,
        headers: {
            ...API_CONFIG.headers,
            ...options.headers
        }
    };

    // 如果有认证令牌，添加到请求头
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('已添加认证令牌到请求头');
    } else {
        console.log('未检测到认证令牌，使用匿名请求');
    }

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

// 防重复调用标志
let isOptimizing = false;

// 优化提示词的主要函数
async function optimizePrompt() {
    // 防止重复调用
    if (isOptimizing) {
        console.log('正在优化中，跳过重复调用');
        return;
    }

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

    // 设置优化状态
    isOptimizing = true;

    // 显示加载状态
    showLoading();

    try {
        const data = await optimizePromptAPI(originalPrompt, selectedModel, selectedMode);

        // 显示结果（默认会滚动）
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
        // 重置优化状态
        isOptimizing = false;
    }
}



// 显示加载状态
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const originalPromptTextarea = document.getElementById('originalPrompt');
    
    // 使用紧凑型加载指示器
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // 禁用优化按钮但保持可视
    if (optimizeBtn) {
        optimizeBtn.disabled = true;
        optimizeBtn.style.opacity = '0.6';
    }
    
    // 保持输入框焦点，让用户知道可以继续编辑
    if (originalPromptTextarea) {
        // 短暂延迟后重新聚焦，避免与按钮点击冲突
        setTimeout(() => {
            originalPromptTextarea.focus();
        }, 100);
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
        optimizeBtn.style.opacity = '1';
    }
}

// 显示结果
function showResult(optimizedPrompt, modelUsed, shouldScroll = true) {
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

        // 只有在明确指定要滚动时才滚动到结果区域
        if (shouldScroll) {
            // 延迟滚动，让用户看到生成完成的提示
            setTimeout(() => {
                outputSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 800); // 延迟800ms后再滚动
        }
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

// 思考模式第一阶段：分析提示词
async function analyzeThinkingPrompt(originalPrompt, model) {
    const requestBody = {
        original_prompt: originalPrompt,
        model: model,
        mode: 'thinking'
    };

    console.log('发送思考模式分析请求:', requestBody);

    return await apiCall('/thinking/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
}

// 使用Gemini生成快速选择选项
async function generateQuickOptions(fieldKey, question) {
    const requestBody = {
        field_key: fieldKey,
        question: question,
        model: 'deepseek-v4-flash'
    };
    
    console.log('🚀 发送快速选项生成请求:', requestBody);
    
    return await apiCall('/generate-quick-options', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
}

// 思考模式第二阶段：基于补充信息优化提示词
async function optimizeThinkingPrompt(originalPrompt, additionalInfo, model) {
    const requestBody = {
        original_prompt: originalPrompt,
        additional_info: additionalInfo,
        model: model
    };

    console.log('发送思考模式优化请求:', requestBody);

    return await apiCall('/thinking/optimize', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
}

// 快速回答API调用
async function generateQuickAnswerAPI(prompt, model = 'deepseek-v4-flash') {
    const requestBody = {
        prompt: prompt,
        model: model
    };

    console.log('发送快速回答请求:', requestBody);

    return await apiCall('/quick-answer/', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
}

// 导出函数到全局作用域
window.optimizePrompt = optimizePrompt;
window.analyzeThinkingPrompt = analyzeThinkingPrompt;
window.optimizeThinkingPrompt = optimizeThinkingPrompt;
window.generateQuickOptions = generateQuickOptions;
window.generateQuickAnswerAPI = generateQuickAnswerAPI;
window.copyToClipboard = copyToClipboard;
window.clearAll = clearAll;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showResult = showResult;
