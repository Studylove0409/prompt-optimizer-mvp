// UI交互模块

// DOM 元素引用
let originalPromptTextarea;
let optimizeBtn;
let copyBtn;
let clearBtn;
let charCountElement;
let helpLink;
let helpModal;
let closeHelpModalBtn;
let businessLink;
let businessModal;
let closeBusinessModalBtn;
let announcementLink;
let announcementModal;
let closeAnnouncementModalBtn;
let startUsingBtn;

// 初始化UI功能
function initUI() {
    // 获取DOM元素
    getDOMElements();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化其他功能
    initOtherFeatures();
    
    // 页面加载动画
    initPageAnimation();
}

// 获取DOM元素
function getDOMElements() {
    originalPromptTextarea = document.getElementById('originalPrompt');
    optimizeBtn = document.getElementById('optimizeBtn');
    copyBtn = document.getElementById('copyBtn');
    clearBtn = document.getElementById('clearBtn');
    charCountElement = document.querySelector('.char-count');
    helpLink = document.getElementById('helpLink');
    helpModal = document.getElementById('helpModal');
    closeHelpModalBtn = document.getElementById('closeHelpModal');
    businessLink = document.getElementById('businessLink');
    businessModal = document.getElementById('businessModal');
    closeBusinessModalBtn = document.getElementById('closeBusinessModal');
    announcementLink = document.getElementById('announcementLink');
    announcementModal = document.getElementById('announcementModal');
    closeAnnouncementModalBtn = document.getElementById('closeAnnouncementModal');
    startUsingBtn = document.getElementById('startUsingBtn');
}

// 绑定事件监听器
function bindEventListeners() {
    // 优化按钮事件
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', () => {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);
            optimizePrompt();
        });
    }

    // 复制和清空按钮事件
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    // 字符计数更新
    if (originalPromptTextarea) {
        originalPromptTextarea.addEventListener('input', updateCharCount);
        
        // 键盘事件处理
        originalPromptTextarea.addEventListener('keydown', handleKeyboardEvents);
    }

    // 模态框事件
    initModalEvents();
    
    // 模型卡片效果
    addModelCardEffects();
    
    // 模式选择事件
    initModeSelection();
    
    // 邮箱复制事件
    initEmailCopyEvent();
}

// 处理键盘事件
function handleKeyboardEvents(e) {
    // Ctrl + Enter: 快速优化 (使用Gemini Flash模型)
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (optimizeBtn) {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);
        }
        quickOptimizePrompt();
    }
    // Enter: 普通优化 (使用当前选择的模型)
    else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (optimizeBtn) {
            optimizeBtn.classList.remove('pulse-hint');
            addButtonAnimation(optimizeBtn);
        }
        optimizePrompt();
    }
    // Shift + Enter: 换行 (默认行为)
}

// 更新字符计数
function updateCharCount() {
    if (!originalPromptTextarea || !charCountElement) return;
    
    const text = originalPromptTextarea.value;
    const count = text.length;
    charCountElement.textContent = `${count} 字符`;

    // 当有内容时，给按钮添加脉冲提示
    if (optimizeBtn) {
        if (count > 0 && !optimizeBtn.classList.contains('pulse-hint')) {
            optimizeBtn.classList.add('pulse-hint');
        } else if (count === 0) {
            optimizeBtn.classList.remove('pulse-hint');
        }
    }
}

// 初始化模态框事件
function initModalEvents() {
    // 帮助弹框
    if (helpLink && helpModal && closeHelpModalBtn) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(helpModal);
        });

        closeHelpModalBtn.addEventListener('click', function() {
            closeModal(helpModal);
        });
    }

    // 问题反馈弹框
    if (businessLink && businessModal && closeBusinessModalBtn) {
        businessLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(businessModal);
        });

        closeBusinessModalBtn.addEventListener('click', function() {
            closeModal(businessModal);
        });
    }

    // 公告弹框
    if (announcementLink && announcementModal && closeAnnouncementModalBtn) {
        announcementLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(announcementModal);
        });

        closeAnnouncementModalBtn.addEventListener('click', function() {
            closeModal(announcementModal);
        });
    }

    // 开始使用按钮
    if (startUsingBtn && announcementModal) {
        startUsingBtn.addEventListener('click', function() {
            closeModal(announcementModal);
            if (originalPromptTextarea) {
                originalPromptTextarea.focus();
            }
        });
    }

    // 点击弹框外部区域关闭弹框
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            closeModal(helpModal);
        }
        if (e.target === businessModal) {
            closeModal(businessModal);
        }
        if (e.target === announcementModal) {
            closeModal(announcementModal);
        }
    });

    // ESC键关闭弹框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (helpModal && helpModal.style.display === 'block') {
                closeModal(helpModal);
            }
            if (businessModal && businessModal.style.display === 'block') {
                closeModal(businessModal);
            }
            if (announcementModal && announcementModal.style.display === 'block') {
                closeModal(announcementModal);
            }
        }
    });
}

// 打开模态框
function openModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

// 关闭模态框
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 恢复背景滚动
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

// 初始化模式选择功能
function initModeSelection() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeSelect = document.getElementById('modeSelect');

    // 按钮模式选择
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            modeBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的active类
            btn.classList.add('active');
            
            // 同步下拉框的值
            if (modeSelect) {
                modeSelect.value = btn.dataset.mode;
            }
        });
    });

    // 下拉框模式选择
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const selectedMode = e.target.value;
            
            // 移除所有按钮的active类
            modeBtns.forEach(btn => btn.classList.remove('active'));
            
            // 找到对应的按钮并添加active类
            const targetBtn = document.querySelector(`[data-mode="${selectedMode}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
        });
    }
}

// 初始化邮箱复制事件
function initEmailCopyEvent() {
    const contactEmail = document.querySelector('.contact-email');
    if (contactEmail) {
        contactEmail.addEventListener('click', async function() {
            const email = this.textContent.trim();
            const success = await copyTextToClipboard(email);
            
            if (success) {
                showCustomAlert('邮箱地址已复制到剪贴板', 'success', 2000);
            } else {
                showCustomAlert('复制失败，请手动复制邮箱地址', 'error', 3000);
            }
        });
    }
}

// 初始化其他功能
function initOtherFeatures() {
    // 设置初始焦点
    if (originalPromptTextarea) {
        originalPromptTextarea.focus();
    }
    
    // 更新字符计数
    updateCharCount();
}

// 页面加载动画
function initPageAnimation() {
    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    initUI();

    // 监听Supabase准备就绪事件
    window.addEventListener('supabaseReady', function() {
        if (window.initAuth) {
            window.initAuth();
        }
    });

    // 如果Supabase已经准备好，立即初始化
    if (window.supabaseClient && window.initAuth) {
        window.initAuth();
    } else {
        // 备用方案：延迟初始化
        setTimeout(() => {
            if (window.supabaseClient && window.initAuth) {
                window.initAuth();
            }
        }, 2000);
    }
});

// 导出函数到全局作用域
window.updateCharCount = updateCharCount;
window.openModal = openModal;
window.closeModal = closeModal;
