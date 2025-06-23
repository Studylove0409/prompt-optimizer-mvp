"""
Supabase服务模块
处理数据库操作和用户历史记录
"""
from supabase import create_client, Client
from fastapi import HTTPException
from typing import Dict, Any, Optional
from datetime import datetime

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
        user_id: str = None,
        session_id: str = None,
        original_prompt: str = "",
        optimized_prompt: str = "",
        mode: str = "general"
    ) -> bool:
        """保存优化历史记录（支持已认证用户和匿名用户）"""
        try:
            # 构建插入数据
            insert_data = {
                "original_prompt": original_prompt,
                "optimized_prompt": optimized_prompt,
                "mode": mode
            }

            if user_id:
                # 已登录用户
                insert_data.update({
                    "user_id": user_id,
                    "user_type": "authenticated",
                    "session_id": None
                })
            elif session_id:
                # 匿名用户
                insert_data.update({
                    "user_id": None,
                    "user_type": "anonymous",
                    "session_id": session_id
                })
            else:
                print("保存历史记录失败: 必须提供 user_id 或 session_id")
                return False

            # 插入历史记录到optimization_history表
            result = self.client.table("optimization_history").insert(insert_data).execute()

            return True

        except Exception as e:
            # 不抛出异常，只记录错误，避免影响主要功能
            print(f"保存历史记录失败: {e}")
            return False
    
    async def get_user_optimization_history(
        self,
        user_id: str = None,
        session_id: str = None,
        limit: int = 50
    ) -> list:
        """获取用户的优化历史记录（支持已登录用户和匿名用户）"""
        try:
            query = self.client.table("optimization_history")\
                .select("id, original_prompt, optimized_prompt, mode, created_at, user_type")

            if user_id:
                # 已登录用户的历史记录
                query = query.eq("user_id", user_id).eq("user_type", "authenticated")
            elif session_id:
                # 匿名用户的历史记录
                query = query.eq("session_id", session_id).eq("user_type", "anonymous")
            else:
                print("获取历史记录失败: 必须提供 user_id 或 session_id")
                return []

            result = query.order("created_at", desc=True).limit(limit).execute()

            return result.data

        except Exception as e:
            print(f"获取历史记录失败: {e}")
            return []

    async def get_user_optimization_history_paginated(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> list:
        """获取用户的优化历史记录（分页版本，仅支持已登录用户）"""
        try:
            # 计算偏移量
            offset = (page - 1) * page_size

            # 构建查询
            query = self.client.table("optimization_history")\
                .select("id, user_id, original_prompt, optimized_prompt, mode, created_at, user_type")\
                .eq("user_id", user_id)\
                .eq("user_type", "authenticated")

            # 添加日期筛选
            if start_date:
                query = query.gte("created_at", start_date.isoformat())
            if end_date:
                query = query.lte("created_at", end_date.isoformat())

            # 添加排序和分页
            query = query.order("created_at", desc=True)\
                .range(offset, offset + page_size - 1)

            result = query.execute()
            return result.data

        except Exception as e:
            print(f"获取分页历史记录失败: {e}")
            raise HTTPException(
                status_code=500,
                detail="数据库查询失败"
            )

    async def get_user_optimization_history_count(
        self,
        user_id: str,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> int:
        """获取用户的优化历史记录总数（仅支持已登录用户）"""
        try:
            # 构建查询
            query = self.client.table("optimization_history")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("user_type", "authenticated")

            # 添加日期筛选
            if start_date:
                query = query.gte("created_at", start_date.isoformat())
            if end_date:
                query = query.lte("created_at", end_date.isoformat())

            result = query.execute()
            return result.count if result.count is not None else 0

        except Exception as e:
            print(f"获取历史记录总数失败: {e}")
            raise HTTPException(
                status_code=500,
                detail="数据库查询失败"
            )

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

    async def update_user_profile(self, user_id: str, update_data: dict) -> bool:
        """更新用户profile信息"""
        try:
            # 添加更新时间戳
            update_data["updated_at"] = datetime.now().isoformat()

            # 执行更新操作
            result = self.client.table("profiles")\
                .update(update_data)\
                .eq("id", user_id)\
                .execute()

            # 检查是否有数据被更新
            if result.data:
                print(f"成功更新用户 {user_id} 的profile")
                return True
            else:
                # 如果没有找到记录，尝试创建一个新的profile
                print(f"用户 {user_id} 的profile不存在，尝试创建新的profile")
                create_data = {"id": user_id, **update_data}
                create_result = self.client.table("profiles").insert(create_data).execute()
                if create_result.data:
                    print(f"成功为用户 {user_id} 创建新的profile")
                    return True
                else:
                    print(f"创建用户 {user_id} 的profile失败")
                    return False

        except Exception as e:
            print(f"更新用户profile失败: {e}")
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

    async def check_email_exists(self, email: str) -> dict:
        """检查邮箱是否已存在，返回详细信息"""
        try:
            # 方法1：尝试调用数据库RPC函数来检查（如果有管理员权限）
            try:
                result = self.client.rpc('check_user_email_exists', {'email_to_check': email}).execute()
                if result.data is not None:
                    exists = bool(result.data)
                    return {
                        'exists': exists,
                        'method': 'rpc_function',
                        'confidence': 'high',
                        'message': '邮箱已存在' if exists else '邮箱可用'
                    }
            except Exception as rpc_error:
                error_details = str(rpc_error)
                if 'Could not find the function' in error_details:
                    # RPC函数不存在，这是正常的
                    pass
                else:
                    print(f"RPC调用失败: {rpc_error}")
            
            # 方法2：实际的解决方案 - 告知前端无法准确检查
            # 在生产环境中，最佳实践是不暴露用户存在性信息
            # 让Supabase在实际注册时处理重复邮箱的情况
            
            print(f"由于安全限制，无法预先检查邮箱 {email} 是否存在")
            
            # 返回一个通用响应，建议用户直接尝试注册
            return {
                'exists': False,  # 默认返回不存在，让用户继续注册流程
                'method': 'security_policy',
                'confidence': 'low',
                'message': '邮箱状态未知，请继续注册流程。如果邮箱已存在，系统会在注册时提示。',
                'note': '由于安全考虑，我们无法预先验证邮箱是否存在。'
            }
            
        except Exception as e:
            print(f"检查邮箱是否存在时发生错误: {e}")
            return {
                'exists': False,
                'method': 'error_fallback',
                'confidence': 'low',
                'message': '无法检查邮箱状态，请继续注册流程',
                'error': str(e)
            }
