// frontend/supabaseClient.js

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

            console.log('Supabase客户端已初始化', supabaseClient);
            return supabaseClient;
        } else {
            console.error('Supabase库未正确加载，window.supabase:', typeof window.supabase);
            return null;
        }
    } catch (error) {
        console.error('初始化Supabase客户端失败:', error);
        return null;
    }
}

// 等待页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保Supabase库完全加载
    setTimeout(() => {
        initializeSupabase();
    }, 100);
});

// 也可以立即尝试初始化（如果库已经加载）
if (document.readyState === 'loading') {
    // 文档还在加载中，等待DOMContentLoaded事件
} else {
    // 文档已经加载完成，立即初始化
    setTimeout(() => {
        initializeSupabase();
    }, 100);
}
