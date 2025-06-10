// frontend/supabaseClient.js

// 确保等待Supabase库加载完成
(function() {
    // 定义创建客户端的函数
    function initSupabase() {
        const SUPABASE_URL = 'https://njzvtxlieysctiapnpsx.supabase.co'; // 替换成你的项目URL
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M'; // 替换成你的anon public密钥

        // 检查Supabase是否已加载
        if (typeof window.supabase !== 'undefined') {
            console.log('Supabase客户端已存在，无需重新创建');
            return;
        }

        if (typeof window.Supabase === 'undefined') {
            console.error('Supabase库尚未加载，无法初始化客户端');
            // 在控制台中警告但不阻止页面加载
            // 5秒后重试一次
            setTimeout(initSupabase, 5000);
            return;
        }

        try {
            // 初始化Supabase客户端
            window.supabase = window.Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase客户端创建成功');
        } catch (error) {
            console.error('Supabase客户端创建失败:', error);
        }
    }

    // 尝试立即初始化
    initSupabase();

    // 如果库还没加载完，等待DOM加载后再次尝试
    window.addEventListener('DOMContentLoaded', function() {
        if (typeof window.supabase === 'undefined') {
            console.log('DOM加载完成后再次尝试初始化Supabase');
            initSupabase();
        }
    });
})();