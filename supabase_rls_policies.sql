-- ========= Supabase RLS 策略配置 =========
-- 这些策略需要在Supabase控制台的SQL编辑器中执行

-- 1. 启用 profiles 表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. 启用 optimization_history 表的 RLS  
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;

-- 3. 启用 subscriptions 表的 RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ========= profiles 表的策略 =========

-- 允许用户查看自己的 profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 允许用户插入自己的 profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ========= optimization_history 表的策略 =========

-- 允许已认证用户查看自己的优化历史
CREATE POLICY "Users can view own optimization history" ON public.optimization_history
    FOR SELECT USING (auth.uid() = user_id);

-- 允许已认证用户插入自己的优化历史
CREATE POLICY "Users can insert own optimization history" ON public.optimization_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许已认证用户删除自己的优化历史（可选）
CREATE POLICY "Users can delete own optimization history" ON public.optimization_history
    FOR DELETE USING (auth.uid() = user_id);

-- ========= subscriptions 表的策略 =========

-- 允许用户查看自己的订阅信息
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = id);

-- 允许系统插入订阅信息（通常由后端服务处理）
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- ========= 函数：自动创建用户 profile =========
-- 当新用户注册时自动创建 profile 记录

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动创建 profile（如果不存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========= 测试查询 =========
-- 执行完上述策略后，可以用这些查询测试

-- 测试 profiles 表
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- 测试 optimization_history 表  
-- SELECT * FROM public.optimization_history WHERE user_id = auth.uid();

-- 测试 subscriptions 表
-- SELECT * FROM public.subscriptions WHERE id = auth.uid();
