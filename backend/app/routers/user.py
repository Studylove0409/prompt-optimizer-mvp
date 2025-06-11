"""
用户相关路由
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from ..config import get_settings, Settings
from ..auth import get_current_user, User
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/profile")
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


@router.get("/stats")
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
