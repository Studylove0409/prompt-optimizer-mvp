-- ========= 临时禁用RLS进行测试 =========
-- 注意：这只是为了测试，生产环境中应该启用RLS

-- 禁用 optimization_history 表的 RLS
ALTER TABLE public.optimization_history DISABLE ROW LEVEL SECURITY;

-- 如果需要重新启用，使用：
-- ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;
