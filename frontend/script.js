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

// 帮助弹框元素 - 在DOM完全加载后再获取
let helpLink;
let helpModal;
let closeHelpModalBtn;

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

    // 获取当前选择的模式
    const selectedMode = getSelectedMode();
    console.log('当前选择的模式:', selectedMode);
    
    // 显示加载状态
    showLoading();

    try {
        // 构建请求体
        const requestBody = {
            original_prompt: originalPrompt,
            model: selectedModel,
            mode: selectedMode  // 添加模式参数
        };
        
        console.log('发送的请求体:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
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
    const selectedMode = getSelectedMode(); // 获取当前模式
    console.log('快速优化 - 当前选择的模式:', selectedMode);

    if (!originalPrompt) {
        showCustomAlert('请输入要优化的提示词', 'warning', 3000);
        throw new Error('没有输入提示词');
    }

    // 显示加载状态
    showLoading();

    try {
        // 构建请求体
        const requestBody = {
            original_prompt: originalPrompt,
            model: quickModel,
            mode: selectedMode // 添加模式参数
        };
        
        console.log('快速优化 - 发送的请求体:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
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
        // 尝试使用现代Clipboard API
        await navigator.clipboard.writeText(optimizedPromptDiv.textContent);

        // 成功复制后的处理
        showCopySuccess();
    } catch (error) {
        console.error('Clipboard API 失败:', error);
        
        // 尝试使用备用方法 - execCommand
        try {
            // 创建临时选区和输入元素
            const textArea = document.createElement('textarea');
            textArea.value = optimizedPromptDiv.textContent;
            
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
            
            if (successful) {
                showCopySuccess();
                return;
            } else {
                throw new Error('execCommand 复制失败');
            }
        } catch (fallbackError) {
            console.error('备用复制方法失败:', fallbackError);
            
            // 两种方法都失败了，显示错误信息
            showCopyError();
        }
    }
}

// 显示复制成功的UI更新
function showCopySuccess() {
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
    console.log('DOM 加载完成，初始化组件');

    // 获取帮助弹框元素
    helpLink = document.getElementById('helpLink');
    helpModal = document.getElementById('helpModal');
    closeHelpModalBtn = document.getElementById('closeHelpModal');

    originalPromptTextarea.focus();
    updateCharCount();
    addModelCardEffects();

    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    // 初始化帮助弹框
    initHelpModal();

    // 初始化认证功能
    setTimeout(() => {
        initAuth();
    }, 500); // 延迟初始化，确保Supabase客户端已加载
});

// 初始化帮助弹框功能
function initHelpModal() {
    console.log('尝试初始化帮助弹框', { helpLink, helpModal, closeHelpModalBtn });
    
    if (helpLink && helpModal && closeHelpModalBtn) {
        console.log('帮助弹框初始化成功');
        
        // 点击帮助链接打开弹框
        helpLink.addEventListener('click', function(e) {
            console.log('点击了帮助链接');
            e.preventDefault();
            openHelpModal();
        });
        
        // 点击关闭按钮关闭弹框
        closeHelpModalBtn.addEventListener('click', function() {
            console.log('点击了关闭按钮');
            closeHelpModalFunction();
        });
        
        // 点击弹框外部区域关闭弹框
        window.addEventListener('click', function(e) {
            if (e.target === helpModal) {
                console.log('点击了弹框外部');
                closeHelpModalFunction();
            }
        });
        
        // ESC键关闭弹框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && helpModal.style.display === 'block') {
                console.log('按下了ESC键');
                closeHelpModalFunction();
            }
        });
    } else {
        console.error('帮助弹框初始化失败', { 
            helpLink: helpLink ? '存在' : '不存在', 
            helpModal: helpModal ? '存在' : '不存在', 
            closeHelpModalBtn: closeHelpModalBtn ? '存在' : '不存在' 
        });
    }
}

// 打开帮助弹框
function openHelpModal() {
    console.log('打开帮助弹框');
    if (helpModal) {
        helpModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    } else {
        console.error('无法打开帮助弹框，元素不存在');
    }
}

// 关闭帮助弹框
function closeHelpModalFunction() {
    console.log('关闭帮助弹框');
    if (helpModal) {
        helpModal.style.display = 'none';
        document.body.style.overflow = ''; // 恢复背景滚动
    } else {
        console.error('无法关闭帮助弹框，元素不存在');
    }
}

// ===== 用户认证功能 =====

// 认证相关DOM元素
let authModal;
let loginBtn;
let logoutBtn;
let userMenu;
let userEmail;
let loginForm;
let registerForm;
let loginFormElement;
let registerFormElement;
let showRegisterFormBtn;
let showLoginFormBtn;
let closeAuthModalBtn;

// 当前用户状态
let currentUser = null;

// 初始化认证功能
function initAuth() {
    console.log('初始化认证功能');

    // 获取DOM元素
    authModal = document.getElementById('authModal');
    loginBtn = document.getElementById('loginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    userMenu = document.getElementById('userMenu');
    userEmail = document.getElementById('userEmail');
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    loginFormElement = document.getElementById('loginFormElement');
    registerFormElement = document.getElementById('registerFormElement');
    showRegisterFormBtn = document.getElementById('showRegisterForm');
    showLoginFormBtn = document.getElementById('showLoginForm');
    closeAuthModalBtn = document.getElementById('closeAuthModal');

    // 检查Supabase是否可用
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase客户端未初始化');
        return;
    }

    // 绑定事件监听器
    bindAuthEvents();

    // 监听认证状态变化
    window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('认证状态变化:', event, session);
        handleAuthStateChange(event, session);
    });

    // 检查当前用户状态
    checkCurrentUser();
}

// 绑定认证相关事件
function bindAuthEvents() {
    // 登录按钮点击
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showAuthModal('login');
        });
    }

    // 登出按钮点击
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // 关闭弹窗
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }

    // 表单切换
    if (showRegisterFormBtn) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterFormFunction();
        });
    }

    if (showLoginFormBtn) {
        showLoginFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginFormFunction();
        });
    }

    // 表单提交
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }

    // 点击弹窗外部关闭
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal && authModal.style.display === 'flex') {
            closeAuthModal();
        }
    });
}

// 显示认证弹窗
function showAuthModal(mode = 'login') {
    if (!authModal) return;

    authModal.style.display = 'flex';

    if (mode === 'login') {
        showLoginFormFunction();
    } else {
        showRegisterFormFunction();
    }
}

// 关闭认证弹窗
function closeAuthModal() {
    if (!authModal) return;

    authModal.style.display = 'none';

    // 清空表单
    if (loginFormElement) loginFormElement.reset();
    if (registerFormElement) registerFormElement.reset();
}

// 显示登录表单
function showLoginFormFunction() {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';

    const modalTitle = document.getElementById('authModalTitle');
    if (modalTitle) modalTitle.textContent = '登录';
}

// 显示注册表单
function showRegisterFormFunction() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';

    const modalTitle = document.getElementById('authModalTitle');
    if (modalTitle) modalTitle.textContent = '注册';
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showCustomAlert('请填写完整的登录信息', 'warning');
        return;
    }

    // 禁用提交按钮
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '登录中...';

    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        showCustomAlert('登录成功！', 'success');
        closeAuthModal();

    } catch (error) {
        console.error('登录失败:', error);
        let errorMessage = '登录失败，请检查邮箱和密码';

        if (error.message.includes('Invalid login credentials')) {
            errorMessage = '邮箱或密码错误，请重试';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '请先验证您的邮箱地址';
        }

        showCustomAlert(errorMessage, 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email || !password || !confirmPassword) {
        showCustomAlert('请填写完整的注册信息', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showCustomAlert('两次输入的密码不一致', 'warning');
        return;
    }

    if (password.length < 6) {
        showCustomAlert('密码长度至少为6位', 'warning');
        return;
    }

    // 禁用提交按钮
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '注册中...';

    try {
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        showCustomAlert('注册成功！请检查您的邮箱以完成验证', 'success', 5000);
        closeAuthModal();

    } catch (error) {
        console.error('注册失败:', error);
        let errorMessage = '注册失败，请重试';

        if (error.message.includes('User already registered')) {
            errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = '密码长度至少为6位';
        }

        showCustomAlert(errorMessage, 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 处理登出
async function handleLogout() {
    try {
        const { error } = await window.supabase.auth.signOut();

        if (error) {
            throw error;
        }

        showCustomAlert('已成功退出登录', 'success');

    } catch (error) {
        console.error('登出失败:', error);
        showCustomAlert('登出失败，请重试', 'error');
    }
}

// 处理认证状态变化
function handleAuthStateChange(event, session) {
    console.log('认证状态变化事件:', event);

    if (session && session.user) {
        // 用户已登录
        currentUser = session.user;
        updateUIForLoggedInUser(session.user);
    } else {
        // 用户未登录
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

// 更新已登录用户的UI
function updateUIForLoggedInUser(user) {
    console.log('更新UI - 用户已登录:', user.email);

    // 隐藏登录按钮，显示用户菜单
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (userEmail) userEmail.textContent = user.email;
}

// 更新未登录用户的UI
function updateUIForLoggedOutUser() {
    console.log('更新UI - 用户未登录');

    // 显示登录按钮，隐藏用户菜单
    if (loginBtn) loginBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    if (userEmail) userEmail.textContent = '';
}

// 检查当前用户状态
async function checkCurrentUser() {
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();

        if (error) {
            console.error('获取用户会话失败:', error);
            return;
        }

        if (session && session.user) {
            currentUser = session.user;
            updateUIForLoggedInUser(session.user);
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }

    } catch (error) {
        console.error('检查用户状态失败:', error);
    }
}

// 获取当前用户
function getCurrentUser() {
    return currentUser;
}

// 检查用户是否已登录
function isUserLoggedIn() {
    return currentUser !== null;
}
