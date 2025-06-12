/**
 * 个人资料模态框管理类
 */
class ProfileModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentUser = null;
        this.currentProfile = null;
        this.newAvatarFile = null;
        this.newAvatarUrl = null;
        
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        // 获取DOM元素
        this.modal = document.getElementById('profileModal');
        this.profileButton = document.getElementById('profileButton');
        this.closeButton = document.getElementById('closeProfileModal');
        this.cancelButton = document.getElementById('cancelProfileBtn');
        this.saveButton = document.getElementById('saveProfileBtn');
        this.changeAvatarBtn = document.getElementById('changeAvatarBtn');
        this.avatarFileInput = document.getElementById('avatarFileInput');
        this.avatarImg = document.getElementById('profileAvatarImg');
        this.usernameInput = document.getElementById('profileUsername');
        this.emailInput = document.getElementById('profileEmail');
        this.avatarOverlay = document.querySelector('.avatar-overlay');

        if (!this.modal) {
            console.error('Profile modal not found');
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        // 打开模态框
        if (this.profileButton) {
            this.profileButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        // 关闭模态框
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeModal());
        }
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this.closeModal());
        }

        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-modal-backdrop')) {
                this.closeModal();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });

        // 头像相关事件
        if (this.changeAvatarBtn) {
            this.changeAvatarBtn.addEventListener('click', () => {
                this.avatarFileInput.click();
            });
        }

        if (this.avatarOverlay) {
            this.avatarOverlay.addEventListener('click', () => {
                this.avatarFileInput.click();
            });
        }

        if (this.avatarFileInput) {
            this.avatarFileInput.addEventListener('change', (e) => {
                this.handleAvatarChange(e);
            });
        }

        // 保存按钮
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                this.saveProfile();
            });
        }
    }

    async openModal() {
        try {
            // 显示模态框
            this.modal.style.display = 'flex';
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
            this.isOpen = true;

            // 加载用户数据
            await this.loadUserData();

        } catch (error) {
            console.error('打开个人资料模态框失败:', error);
            this.showError('加载用户信息失败，请稍后重试');
        }
    }

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.resetForm();
        }, 300);
        this.isOpen = false;
    }

    async loadUserData() {
        try {
            // 第一部分：数据显示
            if (!window.supabaseClient) {
                throw new Error('Supabase客户端未初始化');
            }

            // 获取当前用户
            const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('用户未登录');

            this.currentUser = user;

            // 获取用户profile
            const { data: profiles, error: profileError } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                // PGRST116 是"没有找到记录"的错误码，这是正常的
                throw profileError;
            }

            this.currentProfile = profiles || {};

            // 填充数据到表单
            this.populateForm();

        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showError('加载用户信息失败: ' + error.message);
        }
    }

    populateForm() {
        // 填充邮箱（只读）
        if (this.emailInput && this.currentUser.email) {
            this.emailInput.value = this.currentUser.email;
        }

        // 填充用户名
        if (this.usernameInput) {
            this.usernameInput.value = this.currentProfile.username || '';
        }

        // 填充头像
        if (this.avatarImg) {
            const avatarUrl = this.currentProfile.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.email)}&background=667eea&color=fff`;
            this.avatarImg.src = avatarUrl;
        }
    }

    async handleAvatarChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showError('请选择图片文件');
            return;
        }

        // 验证文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('图片文件大小不能超过5MB');
            return;
        }

        try {
            // 第二部分：头像上传
            this.newAvatarFile = file;

            // 先显示预览
            const reader = new FileReader();
            reader.onload = (e) => {
                this.avatarImg.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // 上传到Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;

            const { data, error } = await window.supabaseClient.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // 获取公共URL
            const { data: { publicUrl } } = window.supabaseClient.storage
                .from('avatars')
                .getPublicUrl(fileName);

            this.newAvatarUrl = publicUrl;
            console.log('头像上传成功:', publicUrl);

        } catch (error) {
            console.error('头像上传失败:', error);
            this.showError('头像上传失败: ' + error.message);
            // 恢复原头像
            this.populateForm();
        }
    }

    async saveProfile() {
        try {
            // 第三部分：保存所有更改
            this.setLoading(true);

            // 获取表单数据
            const newUsername = this.usernameInput.value.trim();
            
            // 构建更新数据
            const updateData = {};
            
            // 检查用户名是否有变化
            if (newUsername !== (this.currentProfile.username || '')) {
                updateData.username = newUsername;
            }
            
            // 检查头像是否有变化
            if (this.newAvatarUrl) {
                updateData.avatar_url = this.newAvatarUrl;
            }

            // 如果没有变化，直接关闭
            if (Object.keys(updateData).length === 0) {
                this.showSuccess('没有需要保存的更改');
                setTimeout(() => this.closeModal(), 1500);
                return;
            }

            // 获取认证token
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session?.access_token) {
                throw new Error('用户未登录');
            }

            // 发送PUT请求到后端API
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '保存失败');
            }

            const result = await response.json();
            console.log('保存成功:', result);

            // 显示成功消息
            this.showSuccess('个人资料保存成功！');

            // 更新本地数据
            this.currentProfile = { ...this.currentProfile, ...updateData };

            // 更新页面上的用户信息显示
            this.updatePageUserInfo();

            // 1.5秒后关闭模态框
            setTimeout(() => {
                this.closeModal();
            }, 1500);

        } catch (error) {
            console.error('保存个人资料失败:', error);
            this.showError('保存失败: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async updatePageUserInfo() {
        // 更新导航栏中的用户信息显示
        if (window.userDropdownManager) {
            try {
                // 构建更新后的用户信息
                const updatedUserInfo = {
                    name: this.currentProfile.username || this.currentUser.email?.split('@')[0] || '用户',
                    email: this.currentUser.email,
                    avatar: this.currentProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.email)}&background=667eea&color=fff`
                };

                // 更新用户下拉菜单中的信息
                window.userDropdownManager.updateUserInfo(updatedUserInfo);
            } catch (error) {
                console.error('更新页面用户信息失败:', error);
            }
        }
    }

    setLoading(loading) {
        if (this.saveButton) {
            if (loading) {
                this.saveButton.classList.add('loading');
                this.saveButton.disabled = true;
                this.saveButton.querySelector('.btn-loading').style.display = 'flex';
            } else {
                this.saveButton.classList.remove('loading');
                this.saveButton.disabled = false;
                this.saveButton.querySelector('.btn-loading').style.display = 'none';
            }
        }
    }

    showError(message) {
        // 这里可以使用你现有的通知系统
        console.error(message);
        alert('错误: ' + message); // 临时使用alert，可以替换为更好的通知组件
    }

    showSuccess(message) {
        // 这里可以使用你现有的通知系统
        console.log(message);
        alert(message); // 临时使用alert，可以替换为更好的通知组件
    }

    resetForm() {
        this.newAvatarFile = null;
        this.newAvatarUrl = null;
        if (this.avatarFileInput) {
            this.avatarFileInput.value = '';
        }
    }
}

// 初始化个人资料模态框
document.addEventListener('DOMContentLoaded', () => {
    window.profileModal = new ProfileModal();
});
