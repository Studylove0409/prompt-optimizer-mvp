-- ========= 修改表结构支持匿名用户 =========

-- 1. 修改 optimization_history 表，使 user_id 可为空，并添加 session_id 字段
ALTER TABLE public.optimization_history 
DROP CONSTRAINT optimization_history_user_id_fkey;

-- 2. 修改 user_id 字段为可空
ALTER TABLE public.optimization_history 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. 添加 session_id 字段用于标识匿名用户会话
ALTER TABLE public.optimization_history 
ADD COLUMN session_id TEXT;

-- 4. 添加 user_type 字段区分用户类型
ALTER TABLE public.optimization_history 
ADD COLUMN user_type TEXT DEFAULT 'authenticated' CHECK (user_type IN ('authenticated', 'anonymous'));

-- 5. 重新添加外键约束（但允许NULL值）
ALTER TABLE public.optimization_history 
ADD CONSTRAINT optimization_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. 添加索引提升查询性能
CREATE INDEX ON public.optimization_history (session_id);
CREATE INDEX ON public.optimization_history (user_type);

-- 7. 添加约束确保数据完整性
ALTER TABLE public.optimization_history 
ADD CONSTRAINT user_identification_check 
CHECK (
  (user_type = 'authenticated' AND user_id IS NOT NULL AND session_id IS NULL) OR
  (user_type = 'anonymous' AND user_id IS NULL AND session_id IS NOT NULL)
);

-- 8. 更新表注释
COMMENT ON TABLE public.optimization_history IS '记录用户的每一次提示词优化操作，支持已登录用户和匿名用户。';
COMMENT ON COLUMN public.optimization_history.user_id IS '已登录用户的ID，匿名用户为NULL';
COMMENT ON COLUMN public.optimization_history.session_id IS '匿名用户的会话ID，已登录用户为NULL';
COMMENT ON COLUMN public.optimization_history.user_type IS '用户类型：authenticated(已登录) 或 anonymous(匿名)';

-- ========= 测试查询 =========
-- 查看表结构
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'optimization_history' 
-- ORDER BY ordinal_position;
