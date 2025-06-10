// 模态框和初始化功能模块

// 模式选择功能
function initModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    let currentMode = 'general'; // 默认模式改为通用模式
    
    // 处理模式按钮点击
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            modeButtons.forEach(b => b.classList.remove('active'));
            // 给当前点击的按钮添加active类
            this.classList.add('active');
            // 更新当前模式
            currentMode = this.dataset.mode;
            
            // 同步更新下拉框的值
            const modeSelect = document.getElementById('modeSelect');
            if (modeSelect) {
                modeSelect.value = currentMode;
            }
            
            // 这里可以根据不同模式修改提示文本或其他UI元素
            updatePlaceholderByMode(currentMode);
        });
    });
    
    // 处理下拉框选择
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
        modeSelect.addEventListener('change', function() {
            // 更新当前模式
            currentMode = this.value;
            
            // 同步更新按钮状态
            modeButtons.forEach(btn => {
                if (btn.dataset.mode === currentMode) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // 更新提示文本
            updatePlaceholderByMode(currentMode);
        });
    }
    
    // 初始化设置默认模式的提示文本
    updatePlaceholderByMode(currentMode);
}

// 根据模式更新输入框提示文本
function updatePlaceholderByMode(mode) {
    const textarea = document.getElementById('originalPrompt');
    if (!textarea) return;
    
    switch(mode) {
        case 'general':
            textarea.placeholder = "在这里输入您想要优化的提示词...例如：我想学习一门新技能";
            break;
        case 'business':
            textarea.placeholder = "在这里输入您想要优化的商业提示词...例如：写一份产品推广方案";
            break;
        case 'drawing':
            textarea.placeholder = "在这里输入您想要优化的绘画提示词...例如：画一个在森林中的小屋";
            break;
        case 'academic':
            textarea.placeholder = "在这里输入您想要优化的学术提示词...例如：解释量子力学的基本原理";
            break;
        default:
            textarea.placeholder = "在这里输入您想要优化的提示词...";
    }
}

// 初始化问题反馈弹窗
function initBusinessModal() {
    const businessLink = document.getElementById('businessLink');
    const businessModal = document.getElementById('businessModal');
    const closeBusinessModal = document.getElementById('closeBusinessModal');
    
    if (!businessLink || !businessModal || !closeBusinessModal) return;
    
    // 点击问题反馈链接显示弹窗
    businessLink.addEventListener('click', function(e) {
        e.preventDefault();
        businessModal.style.display = 'flex';
    });
    
    // 点击关闭按钮隐藏弹窗
    closeBusinessModal.addEventListener('click', function() {
        businessModal.style.display = 'none';
    });
    
    // 点击弹窗外部区域关闭弹窗
    window.addEventListener('click', function(e) {
        if (e.target === businessModal) {
            businessModal.style.display = 'none';
        }
    });
}

// 初始化邮箱复制功能
function initEmailCopy() {
    const contactEmail = document.querySelector('.contact-email');
    if (!contactEmail) return;
    
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

// 初始化公告弹窗
function initAnnouncementModal() {
    const announcementLink = document.getElementById('announcementLink');
    const announcementModal = document.getElementById('announcementModal');
    const closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
    const startUsingBtn = document.getElementById('startUsingBtn');
    
    if (!announcementLink || !announcementModal || !closeAnnouncementModal || !startUsingBtn) return;
    
    // 点击公告链接显示弹窗
    announcementLink.addEventListener('click', function(e) {
        e.preventDefault();
        announcementModal.style.display = 'flex';
    });
    
    // 关闭公告弹窗
    function closeAnnouncement() {
        announcementModal.style.display = 'none';
        // 记录用户已经看过公告
        localStorage.setItem('hasSeenAnnouncement', 'true');
    }

    // 点击关闭按钮
    closeAnnouncementModal.addEventListener('click', closeAnnouncement);

    // 点击开始使用按钮
    startUsingBtn.addEventListener('click', function() {
        closeAnnouncement();
        // 滚动到输入区域
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // 聚焦到输入框
        setTimeout(() => {
            const textarea = document.getElementById('originalPrompt');
            if (textarea) {
                textarea.focus();
            }
        }, 500);
    });

    // 点击弹窗外部区域关闭公告
    window.addEventListener('click', function(e) {
        if (e.target === announcementModal) {
            closeAnnouncement();
        }
    });

    // ESC键关闭公告
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && announcementModal.style.display === 'flex') {
            closeAnnouncement();
        }
    });
    
    // 检查是否已经显示过公告（使用localStorage记录）
    const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');

    // 如果没有看过公告，则在页面加载后显示
    if (!hasSeenAnnouncement) {
        setTimeout(() => {
            announcementModal.style.display = 'flex';
        }, 800); // 延迟800ms显示，让页面先加载完成
    }
}

// Supabase 初始化
function initSupabase() {
    // Supabase 配置
    const SUPABASE_URL = 'https://njzvtxlieysctiapnpsx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M';

    // 初始化Supabase客户端的函数
    function initializeSupabase() {
        try {
            // 检查Supabase库是否已加载
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                // 初始化Supabase客户端
                const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                // 将客户端实例挂载到全局对象
                window.supabaseClient = supabaseClient;

                // 触发自定义事件通知其他脚本
                window.dispatchEvent(new CustomEvent('supabaseReady', { detail: supabaseClient }));

                return supabaseClient;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    // 等待Supabase库加载完成
    function waitForSupabase() {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            initializeSupabase();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    // 页面加载完成后开始等待Supabase库
    document.addEventListener('DOMContentLoaded', function() {
        waitForSupabase();
    });

    // 如果页面已经加载完成，立即开始等待
    if (document.readyState !== 'loading') {
        waitForSupabase();
    }
}

// 初始化粒子系统
function initParticleSystem() {
    // 确保粒子系统能够加载
    window.addEventListener('load', function() {
        if (!window.particleSystem) {
            setTimeout(function() {
                if (typeof ParticleSystem !== 'undefined' && !window.particleSystem) {
                    try {
                        window.particleSystem = new ParticleSystem();
                    } catch (error) {
                        console.error('粒子系统初始化失败:', error);
                    }
                }
            }, 500);
        }
    });
}

// 主初始化函数
function initModals() {
    initModeSelection();
    initBusinessModal();
    initEmailCopy();
    initAnnouncementModal();
    initSupabase();
    initParticleSystem();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initModals);

// 导出函数到全局作用域
window.initModals = initModals;
window.updatePlaceholderByMode = updatePlaceholderByMode;
