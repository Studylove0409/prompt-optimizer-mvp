-- ========= 最小化RLS配置 - 解决历史记录保存问题 =========

-- 1. 启用 optimization_history 表的 RLS
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;

-- 2. 允许已认证用户插入自己的优化历史
CREATE POLICY "Users can insert own optimization history" ON public.optimization_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 允许已认证用户查看自己的优化历史
CREATE POLICY "Users can view own optimization history" ON public.optimization_history
    FOR SELECT USING (auth.uid() = user_id);

-- ========= 测试查询 =========
-- 执行完上述策略后，可以用这个查询测试
-- SELECT auth.uid(); -- 查看当前用户ID
-- SELECT * FROM public.optimization_history WHERE user_id = auth.uid();
