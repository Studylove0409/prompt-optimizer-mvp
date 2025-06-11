-- ========= 第1步：启用RLS =========
-- 在Supabase SQL编辑器中逐步执行以下命令

-- 启用 profiles 表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 启用 optimization_history 表的 RLS  
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;

-- 启用 subscriptions 表的 RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ========= 第2步：创建 profiles 表策略 =========

-- 允许用户查看自己的 profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 允许用户插入自己的 profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ========= 第3步：创建 optimization_history 表策略 =========

-- 允许已认证用户查看自己的优化历史
CREATE POLICY "Users can view own optimization history" ON public.optimization_history
    FOR SELECT USING (auth.uid() = user_id);

-- 允许已认证用户插入自己的优化历史
CREATE POLICY "Users can insert own optimization history" ON public.optimization_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许已认证用户删除自己的优化历史（可选）
CREATE POLICY "Users can delete own optimization history" ON public.optimization_history
    FOR DELETE USING (auth.uid() = user_id);

-- ========= 第4步：创建 subscriptions 表策略 =========

-- 允许用户查看自己的订阅信息
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = id);

-- 允许系统管理订阅信息
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- ========= 第5步：创建自动profile函数（可选）=========

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========= 第6步：创建触发器（可选）=========

-- 删除已存在的触发器（如果有）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新的触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
