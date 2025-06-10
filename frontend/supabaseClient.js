// frontend/supabaseClient.js

const SUPABASE_URL = 'https://njzvtxlieysctiapnpsx.supabase.co'; // 替换成你的项目URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M'; // 替换成你的anon public密钥

// 初始化Supabase客户端
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 