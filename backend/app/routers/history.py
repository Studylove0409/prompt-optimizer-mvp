"""
历史记录路由
"""
from fastapi import APIRouter, Depends
from typing import List

from ..config import get_settings, Settings
from ..auth import get_current_user, User
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def get_optimization_history(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings)
):
    """获取用户的优化历史记录"""
    supabase_service = SupabaseService(settings)
    history = await supabase_service.get_user_optimization_history(str(user.id))
    
    return {
        "history": history,
        "total": len(history)
    }
