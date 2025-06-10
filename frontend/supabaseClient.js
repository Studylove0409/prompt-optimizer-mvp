// frontend/supabaseClient.js

// Supabase 配置
const SUPABASE_URL = 'https://njzvtxlieysctiapnpsx.supabase.co'; // 替换成你的项目URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M'; // 替换成你的anon public密钥

// 等待Supabase库加载完成后初始化客户端
document.addEventListener('DOMContentLoaded', function() {
    // 检查Supabase库是否已加载
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        // 初始化Supabase客户端
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 将客户端实例挂载到全局对象
        window.supabase = supabaseClient;

        console.log('Supabase客户端已初始化');
    } else {
        console.error('Supabase库未正确加载');
    }
});
