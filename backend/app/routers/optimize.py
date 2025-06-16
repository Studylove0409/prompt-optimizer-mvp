"""
提示词优化路由
"""
from fastapi import APIRouter, Depends, Request
from typing import Optional

from ..limiter import limiter
from ..config import get_settings, Settings
from ..models import PromptRequest, PromptResponse, ThinkingAnalysisResponse, ThinkingOptimizationRequest
from ..services.prompt_service import PromptService
from ..auth import get_optional_user, User

router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/optimize", response_model=PromptResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def optimize_prompt(
    request: Request,
    request_body: PromptRequest,
    settings: Settings = Depends(get_settings),
    user: Optional[User] = Depends(get_optional_user)
):
    """优化提示词的API端点"""
    # 获取客户端IP地址
    client_ip = request.client.host if request.client else "unknown"

    prompt_service = PromptService(settings)
    return await prompt_service.optimize_prompt(request_body, user, client_ip)


@router.post("/thinking/analyze", response_model=ThinkingAnalysisResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def analyze_thinking_prompt(
    request: Request,
    request_body: PromptRequest,
    settings: Settings = Depends(get_settings),
    user: Optional[User] = Depends(get_optional_user)
):
    """思考模式第一阶段：分析提示词缺失信息"""
    # 获取客户端IP地址
    client_ip = request.client.host if request.client else "unknown"

    prompt_service = PromptService(settings)
    return await prompt_service.analyze_thinking_prompt(request_body, user, client_ip)


@router.post("/thinking/optimize", response_model=PromptResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def optimize_thinking_prompt(
    request: Request,
    request_body: ThinkingOptimizationRequest,
    settings: Settings = Depends(get_settings),
    user: Optional[User] = Depends(get_optional_user)
):
    """思考模式第二阶段：基于补充信息优化提示词"""
    # 获取客户端IP地址
    client_ip = request.client.host if request.client else "unknown"

    prompt_service = PromptService(settings)
    return await prompt_service.optimize_thinking_prompt(request_body, user, client_ip)
