"""
Supabase服务模块
处理数据库操作和用户历史记录
"""
from supabase import create_client, Client
from fastapi import HTTPException
from typing import Dict, Any, Optional

from ..config import Settings


class SupabaseService:
    """Supabase服务类"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """获取Supabase客户端（懒加载）"""
        if self._client is None:
            if not self.settings.supabase_url or not self.settings.supabase_key:
                raise HTTPException(
                    status_code=500,
                    detail="Supabase配置未完成：请检查环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY"
                )
            
            self._client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_key
            )
        
        return self._client
    
    async def save_optimization_history(
        self,
        user_id: str,
        original_prompt: str,
        optimized_prompt: str,
        mode: str
    ) -> bool:
        """保存优化历史记录（仅限已认证用户）"""
        try:
            # 插入历史记录到optimization_history表
            result = self.client.table("optimization_history").insert({
                "user_id": user_id,
                "original_prompt": original_prompt,
                "optimized_prompt": optimized_prompt,
                "mode": mode
            }).execute()

            return True

        except Exception as e:
            # 不抛出异常，只记录错误，避免影响主要功能
            print(f"保存历史记录失败: {e}")
            return False
    
    async def get_user_optimization_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> list:
        """获取用户的优化历史记录"""
        try:
            result = self.client.table("optimization_history")\
                .select("id, original_prompt, optimized_prompt, mode, created_at")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()

            return result.data

        except Exception as e:
            print(f"获取历史记录失败: {e}")
            return []

    async def get_user_profile(self, user_id: str) -> dict:
        """获取用户profile信息"""
        try:
            result = self.client.table("profiles")\
                .select("id, username, avatar_url, updated_at")\
                .eq("id", user_id)\
                .single()\
                .execute()

            return result.data if result.data else {}

        except Exception as e:
            print(f"获取用户profile失败: {e}")
            return {}

    async def create_user_profile(self, user_id: str, username: str = None) -> bool:
        """创建用户profile（通常在用户首次注册时调用）"""
        try:
            profile_data = {"id": user_id}
            if username:
                profile_data["username"] = username

            result = self.client.table("profiles").insert(profile_data).execute()
            print(f"成功创建用户 {user_id} 的profile")
            return True

        except Exception as e:
            print(f"创建用户profile失败: {e}")
            return False

    async def get_user_subscription(self, user_id: str) -> dict:
        """获取用户订阅信息"""
        try:
            result = self.client.table("subscriptions")\
                .select("id, status, plan_id, current_period_start, current_period_end")\
                .eq("id", user_id)\
                .single()\
                .execute()

            return result.data if result.data else {}

        except Exception as e:
            print(f"获取用户订阅信息失败: {e}")
            return {}
