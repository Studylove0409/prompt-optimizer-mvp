// 主脚本文件 - 整合所有功能模块

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    if (window.initUI) {
        window.initUI();
    }

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














