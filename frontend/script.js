// DOM 元素
const originalPromptTextarea = document.getElementById('originalPrompt');
const optimizeBtn = document.getElementById('optimizeBtn');
const outputSection = document.getElementById('outputSection');
const optimizedPromptDiv = document.getElementById('optimizedPrompt');
const modelUsedDiv = document.getElementById('modelUsed');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');

// 新增元素
const charCountElement = document.querySelector('.char-count');

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
        'deepseek-chat': '普通版',
        'deepseek-reasoner': 'Pro版',
        'gemini-2.0-flash': 'Gemini Flash版',
        'gemini-2.5-pro-preview-03-25': 'Gemini Pro版'
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
    loading.style.display = 'flex';
    outputSection.style.display = 'none';
    optimizeBtn.disabled = true;

    // 添加加载动画类
    document.body.style.overflow = 'hidden';
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
    optimizeBtn.disabled = false;
    document.body.style.overflow = '';
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

        alert('复制失败，请手动选择文本复制');
    }
}

// 清空所有内容
function clearAll() {
    addButtonAnimation(clearBtn);

    // 添加确认对话框
    if (originalPromptTextarea.value.trim() || optimizedPromptDiv.textContent.trim()) {
        if (!confirm('确定要清空所有内容吗？')) {
            return;
        }
    }

    originalPromptTextarea.value = '';
    optimizedPromptDiv.textContent = '';
    modelUsedDiv.textContent = '';
    outputSection.style.display = 'none';
    updateCharCount();
    originalPromptTextarea.focus();

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 模型卡片点击效果
function addModelCardEffects() {
    const modelCards = document.querySelectorAll('.model-card');

    modelCards.forEach(card => {
        card.addEventListener('click', () => {
            // 移除其他卡片的选中状态
            modelCards.forEach(c => c.classList.remove('selected'));
            // 添加当前卡片的选中状态
            card.classList.add('selected');
        });
    });
}

// 事件监听器
optimizeBtn.addEventListener('click', () => {
    addButtonAnimation(optimizeBtn);
    optimizePrompt();
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// 字符计数更新
originalPromptTextarea.addEventListener('input', updateCharCount);

// 支持 Enter + Ctrl 快捷键优化
originalPromptTextarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addButtonAnimation(optimizeBtn);
        optimizePrompt();
    }
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    originalPromptTextarea.focus();
    updateCharCount();
    addModelCardEffects();

    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
