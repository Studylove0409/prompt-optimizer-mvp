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

    // 监听认证状态变化
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            handleAuthStateChange(event, session);
        });
    }

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

    // 禁用提交按钮并显示加载状态
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const { error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
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
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
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

        showCustomAlert('已成功退出登录', 'success');

    } catch (error) {
        console.error('登出失败:', error);
        showCustomAlert('登出失败，请重试', 'error');
    }
}

// 处理认证状态变化
function handleAuthStateChange(_event, session) {
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
    // 隐藏登录按钮，显示用户菜单
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (userEmail) userEmail.textContent = user.email;
}

// 更新未登录用户的UI
function updateUIForLoggedOutUser() {
    // 显示登录按钮，隐藏用户菜单
    if (loginBtn) loginBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    if (userEmail) userEmail.textContent = '';
}

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

        if (session && session.user) {
            currentUser = session.user;
            updateUIForLoggedInUser(session.user);
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }

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
