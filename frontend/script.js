// DOM 元素
const originalPromptTextarea = document.getElementById('originalPrompt');
const optimizeBtn = document.getElementById('optimizeBtn');
const quickOptimizeBtn = document.getElementById('quickOptimizeBtn');
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

        return data; // 返回结果数据

    } catch (error) {
        console.error('优化失败:', error);
        alert('优化失败，请检查网络连接或稍后重试');
        throw error; // 重新抛出错误以便调用者处理
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
            // 触发粒子迸发效果
            triggerParticleBurst(card);
        });
    });
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

// 事件监听器
optimizeBtn.addEventListener('click', () => {
    addButtonAnimation(optimizeBtn);
    optimizePrompt();
});

// 快速优化按钮
if (quickOptimizeBtn) {
    quickOptimizeBtn.addEventListener('click', () => {
        addButtonAnimation(quickOptimizeBtn);
        triggerQuickOptimize();
    });
}

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// 字符计数更新
originalPromptTextarea.addEventListener('input', updateCharCount);

// 键盘事件处理
originalPromptTextarea.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 快速优化 (使用Gemini Flash)
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        triggerQuickOptimize();
    }
    // Enter: 普通优化 (使用当前选择的模型)
    else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addButtonAnimation(optimizeBtn);
        optimizePrompt();
    }
    // Shift + Enter: 换行 (默认行为)
});

// 快速优化功能
function triggerQuickOptimize() {
    const geminiFlashRadio = document.querySelector('input[value="gemini-2.0-flash"]');

    if (geminiFlashRadio) {
        // 保存当前选择
        const currentSelectedRadio = document.querySelector('input[name="model"]:checked');

        // 临时选择Gemini Flash
        geminiFlashRadio.checked = true;

        // 触发粒子效果
        const geminiFlashCard = geminiFlashRadio.closest('.model-card');
        if (geminiFlashCard) {
            triggerParticleBurst(geminiFlashCard);
        }

        // 添加视觉提示
        showQuickOptimizeHint();

        // 执行优化
        addButtonAnimation(optimizeBtn);

        // 使用async/await处理优化
        (async () => {
            try {
                await optimizePrompt();
                // 优化完成后恢复原来的选择
                if (currentSelectedRadio && currentSelectedRadio !== geminiFlashRadio) {
                    setTimeout(() => {
                        currentSelectedRadio.checked = true;
                    }, 1500);
                }
            } catch (error) {
                // 如果出错也恢复选择
                if (currentSelectedRadio && currentSelectedRadio !== geminiFlashRadio) {
                    currentSelectedRadio.checked = true;
                }
                console.error('快速优化失败:', error);
            }
        })();
    } else {
        // 如果找不到Gemini Flash，使用当前选择的模型
        addButtonAnimation(optimizeBtn);
        optimizePrompt();
    }
}

// 显示快速优化提示
function showQuickOptimizeHint() {
    // 创建提示元素
    const hint = document.createElement('div');
    hint.className = 'quick-optimize-hint';
    hint.innerHTML = `
        <span class="hint-icon">⚡</span>
        <span class="hint-text">快速优化模式 - 使用 Gemini Flash</span>
    `;

    // 添加到页面
    document.body.appendChild(hint);

    // 显示动画
    setTimeout(() => {
        hint.classList.add('show');
    }, 10);

    // 3秒后移除
    setTimeout(() => {
        hint.classList.add('hide');
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        }, 300);
    }, 2000);
}

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
