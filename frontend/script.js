// DOM 元素
const originalPromptTextarea = document.getElementById('originalPrompt');
const optimizeBtn = document.getElementById('optimizeBtn');
const outputSection = document.getElementById('outputSection');
const optimizedPromptDiv = document.getElementById('optimizedPrompt');
const modelUsedDiv = document.getElementById('modelUsed');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');

// API 基础URL - 根据环境自动选择
const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'  // 本地开发环境
    : '/api';                      // 部署环境（相对路径）

// 获取选中的模型
function getSelectedModel() {
    const selectedRadio = document.querySelector('input[name="model"]:checked');
    return selectedRadio ? selectedRadio.value : 'deepseek-chat';
}

// 获取模型显示名称
function getModelDisplayName(modelId) {
    const modelNames = {
        'deepseek-chat': 'DeepSeek Chat (V3-0324)',
        'deepseek-reasoner': 'DeepSeek Reasoner (R1-0528)'
    };
    return modelNames[modelId] || modelId;
}

// 优化提示词
async function optimizePrompt() {
    const originalPrompt = originalPromptTextarea.value.trim();
    const selectedModel = getSelectedModel();

    if (!originalPrompt) {
        alert('请输入要优化的提示词');
        return;
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

    } catch (error) {
        console.error('优化失败:', error);
        alert('优化失败，请检查网络连接或稍后重试');
    } finally {
        hideLoading();
    }
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'block';
    outputSection.style.display = 'none';
    optimizeBtn.disabled = true;
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
    optimizeBtn.disabled = false;
}

// 显示结果
function showResult(optimizedPrompt, modelUsed) {
    optimizedPromptDiv.textContent = optimizedPrompt;
    modelUsedDiv.textContent = `使用模型: ${getModelDisplayName(modelUsed)}`;
    outputSection.style.display = 'block';
}

// 复制结果到剪贴板
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(optimizedPromptDiv.textContent);
        
        // 临时改变按钮文本以显示成功
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        copyBtn.style.background = '#48bb78';
        copyBtn.style.color = 'white';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
        
    } catch (error) {
        console.error('复制失败:', error);
        alert('复制失败，请手动选择文本复制');
    }
}

// 清空所有内容
function clearAll() {
    originalPromptTextarea.value = '';
    optimizedPromptDiv.textContent = '';
    modelUsedDiv.textContent = '';
    outputSection.style.display = 'none';
    originalPromptTextarea.focus();
}

// 事件监听器
optimizeBtn.addEventListener('click', optimizePrompt);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// 支持 Enter + Ctrl 快捷键优化
originalPromptTextarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        optimizePrompt();
    }
});

// 页面加载完成后聚焦到输入框
document.addEventListener('DOMContentLoaded', () => {
    originalPromptTextarea.focus();
});
