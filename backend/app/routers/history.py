"""
历史记录路由
"""
from fastapi import APIRouter, Depends, Request, Query
from typing import List, Optional

from ..config import get_settings, Settings
from ..auth import get_optional_user, User
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def get_optimization_history(
    request: Request,
    session_id: Optional[str] = Query(None, description="匿名用户的会话ID"),
    user: Optional[User] = Depends(get_optional_user),
    settings: Settings = Depends(get_settings)
):
    """获取优化历史记录（支持已登录用户和匿名用户）"""
    supabase_service = SupabaseService(settings)

    if user and user.id:
        # 已登录用户，获取用户的历史记录
        history = await supabase_service.get_user_optimization_history(user_id=str(user.id))
        user_type = "authenticated"
    elif session_id:
        # 匿名用户，根据session_id获取历史记录
        history = await supabase_service.get_user_optimization_history(session_id=session_id)
        user_type = "anonymous"
    else:
        # 如果没有提供session_id，尝试根据IP生成默认session_id
        client_ip = request.client.host if request.client else "unknown"
        default_session_id = f"anonymous_{client_ip}_{hash(client_ip) % 10000}"
        history = await supabase_service.get_user_optimization_history(session_id=default_session_id)
        user_type = "anonymous"

    return {
        "history": history,
        "total": len(history),
        "user_type": user_type
    }
