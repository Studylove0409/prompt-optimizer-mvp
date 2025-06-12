"""
历史记录路由
"""
from fastapi import APIRouter, Depends, Request, Query, HTTPException, Response
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from ..config import get_settings, Settings
from ..auth import get_current_user, get_optional_user, get_authenticated_user, User
from ..services.supabase_service import SupabaseService

router = APIRouter(prefix="/api", tags=["history"])


class OptimizationHistoryItem(BaseModel):
    """优化历史记录项模型"""
    id: int = Field(..., description="记录ID")
    user_id: Optional[str] = Field(None, description="用户ID")
    original_prompt: str = Field(..., description="原始提示词")
    optimized_prompt: str = Field(..., description="优化后的提示词")
    mode: str = Field(..., description="优化模式")
    created_at: str = Field(..., description="创建时间")
    user_type: str = Field(..., description="用户类型")


class HistoryResponse(BaseModel):
    """历史记录响应模型"""
    data: List[OptimizationHistoryItem] = Field(..., description="历史记录列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页记录数")
    total_pages: int = Field(..., description="总页数")


@router.get("/history", response_model=List[OptimizationHistoryItem])
async def get_optimization_history_production(
    response: Response,
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(20, ge=1, le=100, description="每页记录数，最大100"),
    user: User = Depends(get_authenticated_user),
    settings: Settings = Depends(get_settings)
):
    """
    获取用户优化历史记录（生产级别，仅支持已登录用户）

    - **认证要求**: 必须提供有效的JWT令牌
    - **分页支持**: 支持分页查询，默认每页20条记录
    - **排序**: 按创建时间降序排列（最新的在前）
    - **响应头**: 包含总记录数信息
    """
    try:
        # 验证用户ID
        if not user or not user.id:
            raise HTTPException(
                status_code=500,
                detail="无法提取用户ID"
            )

        # 创建Supabase服务实例
        supabase_service = SupabaseService(settings)

        # 获取用户历史记录（带分页）
        history_data = await supabase_service.get_user_optimization_history_paginated(
            user_id=str(user.id),
            page=page,
            page_size=page_size
        )

        # 获取总记录数
        total_count = await supabase_service.get_user_optimization_history_count(
            user_id=str(user.id)
        )

        # 计算总页数
        total_pages = (total_count + page_size - 1) // page_size

        # 设置响应头
        response.headers["X-Total-Count"] = str(total_count)
        response.headers["X-Total-Pages"] = str(total_pages)
        response.headers["X-Current-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)

        # 格式化响应数据
        formatted_history = []
        for item in history_data:
            formatted_item = OptimizationHistoryItem(
                id=item.get("id"),
                user_id=item.get("user_id"),
                original_prompt=item.get("original_prompt", ""),
                optimized_prompt=item.get("optimized_prompt", ""),
                mode=item.get("mode", "general"),
                created_at=item.get("created_at", ""),
                user_type=item.get("user_type", "authenticated")
            )
            formatted_history.append(formatted_item)

        return formatted_history

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 处理数据库或其他异常
        raise HTTPException(
            status_code=500,
            detail="数据库查询失败"
        )


@router.get("/history-legacy")
async def get_optimization_history_legacy(
    request: Request,
    session_id: Optional[str] = Query(None, description="匿名用户的会话ID"),
    user: Optional[User] = Depends(get_optional_user),
    settings: Settings = Depends(get_settings)
):
    """获取优化历史记录（兼容旧版本，支持已登录用户和匿名用户）"""
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
