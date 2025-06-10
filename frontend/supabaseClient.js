// frontend/supabaseClient.js

// 使用最简单直接的方式初始化
const SUPABASE_URL = 'https://njzvtxlieysctiapnpsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenZ0eGxpZXlzY3RpYXBucHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mzc0OTEsImV4cCI6MjA2NTExMzQ5MX0.uECZbzE72n1rxoQRhPXe4GfdLfXgaJ853T6dh_ezL7M';

// 确保这里的变量名是 supabase，不要使用window前缀
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);