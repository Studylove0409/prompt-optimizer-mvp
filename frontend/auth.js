// 认证模块

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
let loginTab;
let registerTab;
let authTabIndicator;

// 当前用户状态
let currentUser = null;

// ===================================================================
// 核心：Supabase 认证状态监听器
// ===================================================================
function setupAuthStateListener() {
    console.log('设置认证状态监听器，Supabase客户端状态:', !!window.supabaseClient);

    if (window.supabaseClient) {
        console.log('开始监听认证状态变化...');

        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            // 加上这行日志，方便你在浏览器控制台里看到每次状态变化的具体事件
            console.log(`认证事件: ${event}`, session);
            console.log('当前URL:', window.location.href);
            console.log('URL Hash:', window.location.hash);

            const user = session?.user;

            // 当事件是 SIGNED_IN 时，我们可以认为是一次登录或激活成功
            if (event === "SIGNED_IN") {
                console.log('检测到SIGNED_IN事件');

                // 检查URL里是否包含认证相关参数
                const hasAccessToken = window.location.hash.includes('access_token');
                const hasTokenType = window.location.hash.includes('token_type');
                const isFromEmailLink = hasAccessToken || hasTokenType;

                console.log('是否来自邮件链接:', isFromEmailLink, {hasAccessToken, hasTokenType});

                if (isFromEmailLink) {
                    console.log('显示激活成功提示');
                    showToast('账户激活成功！', '欢迎您！', 'success', 4000);

                    // 清理URL，让它看起来更干净
                    setTimeout(() => {
                        window.history.replaceState(null, null, window.location.pathname);
                    }, 1000);
                }
            }

            // 不管发生什么事件，都调用一个统一的函数来更新UI
            updateUI(user);
        });
    } else {
        console.warn('Supabase客户端未准备就绪，无法设置认证监听器');
    }
}

// 监听Supabase客户端准备就绪事件
window.addEventListener('supabaseReady', (event) => {
    console.log('收到supabaseReady事件:', event.detail);
    setupAuthStateListener();
});

// 处理邮箱验证回调
function handleEmailVerificationCallback() {
    const hash = window.location.hash;
    console.log('检查邮箱验证回调，当前hash:', hash);

    if (hash && (hash.includes('access_token') || hash.includes('token_type'))) {
        console.log('检测到邮箱验证回调参数');

        // 确保Supabase客户端可用
        if (window.supabaseClient) {
            console.log('Supabase客户端可用，处理认证回调');
            // Supabase会自动处理URL中的认证参数
            // 我们只需要等待onAuthStateChange事件
        } else {
            console.log('Supabase客户端未准备就绪，等待初始化...');
            // 监听supabaseReady事件
            window.addEventListener('supabaseReady', () => {
                console.log('Supabase客户端准备就绪，重新检查认证状态');
                // Supabase客户端初始化后会自动处理URL参数
            }, { once: true });
        }
    }
}

// 页面加载完成后检查并设置监听器
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，检查Supabase客户端...');

    // 首先处理可能的邮箱验证回调
    handleEmailVerificationCallback();

    // 延迟检查，确保Supabase客户端有时间初始化
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase客户端已准备就绪，设置监听器');
            setupAuthStateListener();
        } else {
            console.log('等待Supabase客户端初始化...');
            // 继续等待supabaseReady事件
        }
    }, 500);
});

// 如果Supabase客户端已经可用，立即设置监听器
if (window.supabaseClient) {
    console.log('Supabase客户端已存在，立即设置监听器');
    setupAuthStateListener();
}

// ===================================================================
// 统一更新UI的函数
// ===================================================================
function updateUI(user) {
    console.log('更新UI，用户状态:', user ? `已登录 (${user.email})` : '未登录');

    // 获取你需要根据登录状态切换显示的HTML元素
    const loggedOutElements = document.getElementById('loggedOutStateContainer');
    const loggedInElements = document.getElementById('loggedInStateContainer');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    console.log('UI元素状态:', {
        loggedOutElements: !!loggedOutElements,
        loggedInElements: !!loggedInElements,
        userEmailDisplay: !!userEmailDisplay
    });

    if (user) {
        // --- 用户已登录 ---
        console.log('设置已登录状态UI');

        if (loggedOutElements) {
            loggedOutElements.style.display = 'none';
            console.log('隐藏登录按钮');
        }

        if (loggedInElements) {
            loggedInElements.style.display = 'flex';
            console.log('显示用户菜单');
        }

        // 更新显示的邮箱
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email;
            console.log('更新用户邮箱显示:', user.email);
        }

        // 更新全局用户状态
        currentUser = user;
    } else {
        // --- 用户未登录 ---
        console.log('设置未登录状态UI');

        if (loggedInElements) {
            loggedInElements.style.display = 'none';
            console.log('隐藏用户菜单');
        }

        if (loggedOutElements) {
            loggedOutElements.style.display = 'block';
            console.log('显示登录按钮');
        }

        // 清空用户信息
        if (userEmailDisplay) {
            userEmailDisplay.textContent = '';
            console.log('清空用户邮箱显示');
        }

        // 更新全局用户状态
        currentUser = null;
    }
}

// 初始化认证功能
function initAuth() {
    // 获取DOM元素
    getAuthDOMElements();
    
    // 检查Supabase是否可用
    if (!window.supabaseClient) {
        return;
    }

    // 绑定事件监听器
    bindAuthEvents();

    // 初始化UI功能
    initAuthUI();

    // 认证状态监听器已在文件顶部设置

    // 检查当前用户状态
    checkCurrentUser();
}

// 获取认证相关DOM元素
function getAuthDOMElements() {
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
    loginTab = document.getElementById('loginTab');
    registerTab = document.getElementById('registerTab');
    authTabIndicator = document.querySelector('.auth-tab-indicator');
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

    // 标签切换
    if (loginTab) {
        loginTab.addEventListener('click', () => {
            switchToLoginTab();
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', () => {
            switchToRegisterTab();
        });
    }

    // 表单切换（兼容旧版本）
    if (showRegisterFormBtn) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRegisterTab();
        });
    }

    if (showLoginFormBtn) {
        showLoginFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLoginTab();
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
            if (e.target === authModal || e.target.classList.contains('auth-modal-backdrop')) {
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

// 初始化认证UI功能
function initAuthUI() {
    // 初始化密码显示切换
    initPasswordToggles();

    // 初始化密码强度检测
    initPasswordStrength();

    // 初始化表单验证
    initFormValidation();

    // 初始化浮动标签
    initFloatingLabels();
}

// 初始化密码显示切换（认证模块专用）
function initPasswordToggles() {
    // 检查是否已经在ui.js中初始化过了
    if (window.initPasswordToggles && typeof window.initPasswordToggles === 'function') {
        // 使用ui.js中的实现
        window.initPasswordToggles();
        return;
    }

    // 备用实现（如果ui.js未加载）
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
        // 检查是否已经绑定过事件
        if (toggle.dataset.initialized === 'true') {
            return;
        }

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const input = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
            const eyeOpen = toggle.querySelector('.eye-open');
            const eyeClosed = toggle.querySelector('.eye-closed');

            if (input && eyeOpen && eyeClosed) {
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                } else {
                    input.type = 'password';
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                }
            }
        });

        // 标记为已初始化
        toggle.dataset.initialized = 'true';
    });
}

// 初始化密码强度检测
function initPasswordStrength() {
    const registerPassword = document.getElementById('registerPassword');
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (registerPassword && strengthBar && strengthText) {
        registerPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);

            strengthBar.style.width = `${strength.percentage}%`;
            strengthText.textContent = strength.text;

            // 更新颜色
            if (strength.percentage < 30) {
                strengthBar.style.background = '#FF3B30';
            } else if (strength.percentage < 70) {
                strengthBar.style.background = '#FF9500';
            } else {
                strengthBar.style.background = '#34C759';
            }
        });
    }
}

// 计算密码强度
function calculatePasswordStrength(password) {
    let score = 0;
    let text = '密码强度';

    if (password.length >= 6) score += 20;
    if (password.length >= 8) score += 10;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    if (score < 30) {
        text = '密码强度：弱';
    } else if (score < 70) {
        text = '密码强度：中';
    } else {
        text = '密码强度：强';
    }

    return { percentage: Math.min(score, 100), text };
}

// 初始化表单验证
function initFormValidation() {
    const inputs = document.querySelectorAll('.auth-form input');

    inputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearError);
    });
}

// 验证输入
function validateInput(e) {
    const input = e.target;
    const errorElement = input.parentElement.parentElement.querySelector('.form-error');

    if (!errorElement) return;

    let errorMessage = '';

    if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            errorMessage = '请输入有效的邮箱地址';
        }
    }

    if (input.type === 'password' && input.value) {
        if (input.value.length < 6) {
            errorMessage = '密码长度至少为6位';
        }
    }

    if (input.id === 'confirmPassword' && input.value) {
        const password = document.getElementById('registerPassword').value;
        if (input.value !== password) {
            errorMessage = '两次输入的密码不一致';
        }
    }

    showError(errorElement, errorMessage);
}

// 清除错误提示
function clearError(e) {
    const input = e.target;
    const errorElement = input.parentElement.parentElement.querySelector('.form-error');

    if (errorElement) {
        showError(errorElement, '');
    }
}

// 显示错误提示
function showError(errorElement, message) {
    if (message) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    } else {
        errorElement.classList.remove('show');
        setTimeout(() => {
            if (!errorElement.classList.contains('show')) {
                errorElement.textContent = '';
            }
        }, 300);
    }
}

// 初始化浮动标签
function initFloatingLabels() {
    const inputs = document.querySelectorAll('.auth-form input');

    inputs.forEach(input => {
        // 检查初始值
        if (input.value) {
            input.classList.add('has-value');
        }

        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
}

// 显示认证弹窗
function showAuthModal(mode = 'login') {
    if (!authModal) return;

    authModal.style.display = 'flex';

    if (mode === 'login') {
        switchToLoginTab();
    } else {
        switchToRegisterTab();
    }

    // 重新初始化UI功能（确保动态内容正常工作）
    setTimeout(() => {
        // 优先使用ui.js中的密码切换初始化
        if (window.initPasswordToggles && typeof window.initPasswordToggles === 'function') {
            window.initPasswordToggles();
        } else {
            initPasswordToggles();
        }
        initFloatingLabels();
    }, 100);
}

// 关闭认证弹窗
function closeAuthModal() {
    if (!authModal) return;

    authModal.style.display = 'none';

    // 清空表单
    if (loginFormElement) loginFormElement.reset();
    if (registerFormElement) registerFormElement.reset();
}

// 切换到登录标签
function switchToLoginTab() {
    if (loginTab) {
        loginTab.classList.add('active');
    }
    if (registerTab) {
        registerTab.classList.remove('active');
    }
    if (authTabIndicator) {
        authTabIndicator.classList.remove('register');
    }

    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
}

// 切换到注册标签
function switchToRegisterTab() {
    if (loginTab) {
        loginTab.classList.remove('active');
    }
    if (registerTab) {
        registerTab.classList.add('active');
    }
    if (authTabIndicator) {
        authTabIndicator.classList.add('register');
    }

    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
}

// 检查Supabase客户端是否可用
function checkSupabaseClient() {
    if (!window.supabaseClient) {
        showCustomAlert('认证服务暂时不可用，请刷新页面重试', 'error');
        return false;
    }
    return true;
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    if (!checkSupabaseClient()) return;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showCustomAlert('请填写完整的登录信息', 'warning');
        return;
    }

    // 禁用提交按钮并显示加载状态
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        // 成功后什么都不用做，onAuthStateChange会自动监听到变化并更新UI！
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
        submitBtn.classList.remove('loading');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();

    if (!checkSupabaseClient()) return;

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms');

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

    // 检查用户协议复选框
    console.log('检查协议复选框:', agreeTerms, agreeTerms ? agreeTerms.checked : 'null');
    if (!agreeTerms || !agreeTerms.checked) {
        console.log('显示协议确认对话框');
        // 检查 showCustomConfirm 函数是否存在
        if (typeof showCustomConfirm === 'function') {
            showCustomConfirm(
                '请同意协议后点击注册',
                () => {
                    // 确认按钮：自动勾选协议复选框并继续注册
                    console.log('用户点击确认，自动勾选协议');
                    if (agreeTerms) {
                        agreeTerms.checked = true;
                    }
                    // 继续执行注册流程
                    proceedWithRegistration(e, email, password);
                },
                () => {
                    // 取消按钮：什么都不做，关闭对话框
                    console.log('用户点击取消');
                },
                '📋'
            );
        } else {
            console.error('showCustomConfirm 函数不存在');
            showCustomAlert('请先同意用户协议和隐私政策', 'warning');
        }
        return;
    }

    // 继续执行注册流程
    proceedWithRegistration(e, email, password);
}

// 执行实际的注册流程
async function proceedWithRegistration(e, email, password) {
    // 禁用提交按钮并显示加载状态
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
    }

    try {
        const { error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            throw error;
        }

        // 显示注册成功界面
        showRegisterSuccess();

        // 显示吐司提示
        showToast('注册成功！', '请检查您的邮箱以完成验证', 'success', 5000);

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
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }
}

// 处理登出
async function handleLogout() {
    if (!checkSupabaseClient()) return;

    try {
        const { error } = await window.supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        // 成功后什么都不用做，onAuthStateChange会自动监听到变化并更新UI！
        showCustomAlert('已成功退出登录', 'success');

    } catch (error) {
        console.error('登出失败:', error);
        showCustomAlert('登出失败，请重试', 'error');
    }
}

// 旧的认证状态处理函数已被统一的updateUI函数替代

// 检查当前用户状态
async function checkCurrentUser() {
    if (!window.supabaseClient) {
        return;
    }

    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error) {
            return;
        }

        // 使用统一的updateUI函数
        updateUI(session?.user);

    } catch (error) {
        // 静默处理错误
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

// 显示注册成功界面
function showRegisterSuccess() {
    const registerFormElement = document.getElementById('registerFormElement');
    const registerSuccess = document.getElementById('registerSuccess');

    if (registerFormElement && registerSuccess) {
        // 隐藏注册表单
        registerFormElement.style.display = 'none';

        // 显示成功提示
        registerSuccess.style.display = 'flex';

        // 绑定返回登录按钮事件
        const backToLoginBtn = document.getElementById('backToLoginBtn');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', () => {
                // 重置表单显示状态
                registerFormElement.style.display = 'block';
                registerSuccess.style.display = 'none';

                // 清空表单
                registerFormElement.reset();

                // 切换到登录标签
                switchToLoginTab();
            });
        }
    }
}

// 显示吐司提示
function showToast(title, message, type = 'info', duration = 3000) {
    // 创建吐司容器（如果不存在）
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建吐司元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // 图标映射
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;

    // 添加到容器
    toastContainer.appendChild(toast);

    // 绑定关闭按钮事件
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
    }

    // 自动移除
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }

    return toast;
}

// 移除吐司提示
function removeToast(toast) {
    if (toast && toast.parentNode) {
        toast.classList.add('toast-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// 导出函数到全局作用域
window.initAuth = initAuth;
window.getCurrentUser = getCurrentUser;
window.isUserLoggedIn = isUserLoggedIn;
window.showRegisterSuccess = showRegisterSuccess;
window.showToast = showToast;
