/**
 * 用户下拉菜单功能模块
 */

class UserDropdownManager {
    constructor() {
        this.isInitialized = false;
        this.isDropdownOpen = false;
        
        // 绑定方法到实例
        this.handleAvatarClick = this.handleAvatarClick.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleDropdownClick = this.handleDropdownClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // 获取DOM元素
        this.userAvatarBtn = document.getElementById('userAvatarBtn');
        this.userDropdown = document.getElementById('userDropdown');
        this.userAvatarSection = document.getElementById('userAvatarSection');
        this.authSection = document.getElementById('authSection');
        this.loginBtn = document.getElementById('loginBtn');
        
        // 用户信息元素
        this.userNameElement = document.getElementById('userName');
        this.userEmailElement = document.getElementById('userEmail');
        this.userAvatarImg = document.getElementById('userAvatarImg');
        this.userAvatarImgLarge = document.getElementById('userAvatarImgLarge');
        
        // 菜单项元素
        this.historyButton = document.getElementById('historyButton');
        this.profileButton = document.getElementById('profileButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.logoutBtn = document.getElementById('logoutBtn');
    }

    bindEvents() {
        // 头像按钮点击事件
        if (this.userAvatarBtn) {
            this.userAvatarBtn.addEventListener('click', this.handleAvatarClick);
        }

        // 文档点击事件（用于关闭下拉菜单）
        document.addEventListener('click', this.handleDocumentClick);

        // 下拉菜单内部点击事件（阻止冒泡）
        if (this.userDropdown) {
            this.userDropdown.addEventListener('click', this.handleDropdownClick);
        }

        // 键盘事件
        document.addEventListener('keydown', this.handleKeydown);

        // 窗口大小改变事件
        window.addEventListener('resize', this.handleWindowResize.bind(this));

        // 菜单项点击事件
        this.bindMenuItemEvents();
    }

    bindMenuItemEvents() {
        // 历史记录按钮
        if (this.historyButton) {
            this.historyButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeDropdown();
                // 触发历史记录功能
                if (typeof historyManager !== 'undefined' && historyManager.openHistoryModal) {
                    historyManager.openHistoryModal();
                } else {
                    console.log('历史记录功能');
                }
            });
        }

        // 个人资料按钮
        if (this.profileButton) {
            this.profileButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeDropdown();
                console.log('个人资料功能');
                // 这里可以添加个人资料功能
            });
        }

        // 设置按钮
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeDropdown();
                console.log('设置功能');
                // 这里可以添加设置功能
            });
        }

        // 退出登录按钮
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeDropdown();
                this.handleLogout();
            });
        }
    }

    handleAvatarClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown();
    }

    handleDocumentClick(e) {
        // 如果点击的不是头像按钮或下拉菜单内部，则关闭下拉菜单
        if (this.isDropdownOpen && 
            !this.userAvatarBtn.contains(e.target) && 
            !this.userDropdown.contains(e.target)) {
            this.closeDropdown();
        }
    }

    handleDropdownClick(e) {
        // 阻止下拉菜单内部点击事件冒泡
        e.stopPropagation();
    }

    handleKeydown(e) {
        // ESC键关闭下拉菜单
        if (e.key === 'Escape' && this.isDropdownOpen) {
            this.closeDropdown();
        }
    }

    handleWindowResize() {
        // 如果下拉菜单是打开的，重新调整位置
        if (this.isDropdownOpen) {
            // 延迟执行以确保窗口大小改变完成
            setTimeout(() => {
                this.adjustDropdownPosition();
            }, 100);
        }
    }

    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        if (!this.userDropdown) return;
        
        // 先移除可能存在的位置调整类
        this.userDropdown.classList.remove('dropdown-up', 'edge-adjust');
        
        this.isDropdownOpen = true;
        this.userDropdown.classList.add('show');
        this.userAvatarBtn.classList.add('active');
        
        // 检测位置并调整
        this.adjustDropdownPosition();
        
        // 添加动画类
        this.userDropdown.style.animation = 'dropdownFadeIn 0.2s ease-out';
    }

    adjustDropdownPosition() {
        if (!this.userDropdown || !this.userAvatarBtn) return;
        
        // 使用requestAnimationFrame确保DOM已经渲染完成
        requestAnimationFrame(() => {
            const dropdown = this.userDropdown;
            const avatarBtn = this.userAvatarBtn;
            
            // 获取按钮和下拉框的位置信息
            const btnRect = avatarBtn.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // 获取下拉框实际高度，如果还没有渲染完成则使用预估值
            let dropdownHeight = dropdown.offsetHeight;
            if (dropdownHeight === 0) {
                // 临时显示来获取高度
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '0';
                dropdownHeight = dropdown.offsetHeight;
                dropdown.style.visibility = 'hidden';
                dropdown.style.opacity = '';
            }
            
            // 如果还是获取不到高度，使用预估值
            if (dropdownHeight === 0) {
                dropdownHeight = 320; // 预估高度
            }
            
            // 检查是否需要向上展开
            const spaceBelow = viewportHeight - btnRect.bottom - 10; // 10px余量
            const spaceAbove = btnRect.top - 10; // 10px余量
            
            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                dropdown.classList.add('dropdown-up');
            }
            
            // 检查水平边界，在移动端调整位置
            if (window.innerWidth <= 768) {
                const spaceRight = viewportWidth - btnRect.right;
                const dropdownWidth = dropdown.offsetWidth || parseInt(getComputedStyle(dropdown).width);
                
                // 如果右侧空间不够，向左调整
                if (spaceRight < dropdownWidth - 30) {
                    dropdown.classList.add('edge-adjust');
                }
            }
        });
    }

    closeDropdown() {
        if (!this.userDropdown) return;
        
        this.isDropdownOpen = false;
        this.userDropdown.classList.remove('show');
        this.userAvatarBtn.classList.remove('active');
        
        // 添加动画类
        this.userDropdown.style.animation = 'dropdownFadeOut 0.2s ease-out';
    }

    // 显示用户菜单（登录后调用）
    showUserMenu(userInfo = {}) {
        if (this.loginBtn) {
            this.loginBtn.style.display = 'none';
        }
        if (this.userAvatarSection) {
            this.userAvatarSection.style.display = 'block';
        }

        // 更新用户信息
        this.updateUserInfo(userInfo);
    }

    // 隐藏用户菜单（退出登录后调用）
    hideUserMenu() {
        if (this.loginBtn) {
            this.loginBtn.style.display = 'block';
        }
        if (this.userAvatarSection) {
            this.userAvatarSection.style.display = 'none';
        }
        
        // 关闭下拉菜单
        this.closeDropdown();
    }

    // 更新用户信息
    updateUserInfo(userInfo) {
        const {
            name = '用户',
            email = 'user@example.com',
            avatar = 'https://via.placeholder.com/40'
        } = userInfo;

        // 更新用户名
        if (this.userNameElement) {
            this.userNameElement.textContent = name;
        }

        // 更新邮箱
        if (this.userEmailElement) {
            this.userEmailElement.textContent = email;
        }

        // 更新头像
        if (this.userAvatarImg) {
            this.userAvatarImg.src = avatar;
            this.userAvatarImg.alt = `${name}的头像`;
        }

        if (this.userAvatarImgLarge) {
            this.userAvatarImgLarge.src = avatar;
            this.userAvatarImgLarge.alt = `${name}的头像`;
        }
    }

    // 处理退出登录
    handleLogout() {
        // 显示确认对话框
        if (typeof showCustomConfirm === 'function') {
            showCustomConfirm(
                '确定要退出登录吗？',
                () => {
                    // 确认回调
                    this.performLogout();
                },
                () => {
                    // 取消回调 - 什么都不做
                    console.log('用户取消退出登录');
                },
                '🚪'
            );
        } else {
            if (confirm('确定要退出登录吗？')) {
                this.performLogout();
            }
        }
    }

    // 执行退出登录
    performLogout() {
        try {
            // 调用Supabase退出登录
            if (window.supabaseClient) {
                window.supabaseClient.auth.signOut().then(() => {
                    this.hideUserMenu();
                    if (typeof showCustomAlert === 'function') {
                        showCustomAlert('已成功退出登录', 'success');
                    }
                });
            } else {
                // 备用方案
                this.hideUserMenu();
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('已成功退出登录', 'success');
                }
            }
        } catch (error) {
            console.error('退出登录失败:', error);
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('退出登录失败，请重试', 'error');
            }
        }
    }

    // 获取当前用户信息（从Supabase或其他来源）
    async getCurrentUserInfo() {
        try {
            if (window.supabaseClient) {
                const { data: { user }, error } = await window.supabaseClient.auth.getUser();
                if (error) throw error;

                if (user) {
                    // 尝试从profiles表获取用户信息
                    let profileData = {};
                    try {
                        const { data: profiles, error: profileError } = await window.supabaseClient
                            .from('profiles')
                            .select('username, avatar_url')
                            .eq('id', user.id)
                            .single();

                        if (!profileError && profiles) {
                            profileData = profiles;
                        }
                    } catch (profileError) {
                        console.log('获取profile信息失败，使用默认值:', profileError);
                    }

                    return {
                        name: profileData.username || user.user_metadata?.name || user.email?.split('@')[0] || '用户',
                        email: user.email,
                        avatar: profileData.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=667eea&color=fff`
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
}

// 初始化用户下拉菜单管理器
let userDropdownManager;

// 等待DOM加载完成后初始化
function initializeUserDropdown() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUserDropdown);
        return;
    }

    try {
        userDropdownManager = new UserDropdownManager();
        window.userDropdownManager = userDropdownManager;
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('userDropdownReady'));
        
        console.log('用户下拉菜单初始化成功');
    } catch (error) {
        console.error('用户下拉菜单初始化失败:', error);
    }
}

// 开始初始化
initializeUserDropdown();

// 导出到全局作用域
window.UserDropdownManager = UserDropdownManager;
