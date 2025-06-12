"""
用户相关路由
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from ..config import get_settings, Settings
from ..auth import get_current_user, User
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api", tags=["user"])


# Pydantic模型定义
class ProfileUpdateRequest(BaseModel):
    """用户profile更新请求模型"""
    username: Optional[str] = Field(None, description="用户名", max_length=50)
    avatar_url: Optional[str] = Field(None, description="头像URL", max_length=500)


@router.get("/user/profile")
async def get_user_profile(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """获取当前用户的profile信息"""
    supabase_service = SupabaseService(settings)
    
    # 获取用户profile
    profile = await supabase_service.get_user_profile(str(user.id))
    
    # 获取用户订阅信息
    subscription = await supabase_service.get_user_subscription(str(user.id))
    
    return {
        "user_id": str(user.id),
        "email": user.email,
        "profile": profile,
        "subscription": subscription
    }


@router.get("/user/stats")
async def get_user_stats(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """获取用户的使用统计信息"""
    supabase_service = SupabaseService(settings)
    
    # 获取历史记录
    history = await supabase_service.get_user_optimization_history(str(user.id), limit=1000)
    
    # 统计信息
    total_optimizations = len(history)
    
    # 按模式统计
    mode_stats = {}
    for record in history:
        mode = record.get('mode', 'unknown')
        mode_stats[mode] = mode_stats.get(mode, 0) + 1
    
    # 最近7天的使用情况（简单统计）
    from datetime import datetime, timedelta
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_count = 0
    
    for record in history:
        created_at = record.get('created_at')
        if created_at:
            # 简单的日期比较（实际项目中应该用更精确的日期解析）
            try:
                record_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if record_date >= seven_days_ago:
                    recent_count += 1
            except:
                pass
    
    return {
        "total_optimizations": total_optimizations,
        "recent_7_days": recent_count,
        "mode_statistics": mode_stats,
        "last_optimization": history[0] if history else None
    }


@router.put("/profile")
async def update_user_profile(
    profile_data: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """更新当前用户的profile信息"""
    try:
        supabase_service = SupabaseService(settings)

        # 验证用户ID
        if not user.id:
            raise HTTPException(
                status_code=500,
                detail="无法获取用户ID"
            )

        # 构建更新数据（只包含非None的字段）
        update_data = {}
        if profile_data.username is not None:
            update_data["username"] = profile_data.username
        if profile_data.avatar_url is not None:
            update_data["avatar_url"] = profile_data.avatar_url

        # 如果没有要更新的数据
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="没有提供要更新的数据"
            )

        # 更新用户profile
        success = await supabase_service.update_user_profile(str(user.id), update_data)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="更新用户信息失败"
            )

        # 获取更新后的profile信息
        updated_profile = await supabase_service.get_user_profile(str(user.id))

        return {
            "success": True,
            "message": "用户信息更新成功",
            "profile": updated_profile
        }

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 处理其他异常
        raise HTTPException(
            status_code=500,
            detail=f"更新用户信息时发生错误: {str(e)}"
        )
