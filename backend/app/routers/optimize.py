"""
提示词优化路由
"""
from fastapi import APIRouter, Depends, Request
from typing import Optional

from ..limiter import limiter
from ..config import get_settings, Settings
from ..models import PromptRequest, PromptResponse, AnalyzeRequest, AnalyzeResponse, SynthesizeRequest, SynthesizeResponse
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


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def analyze_idea(
    request: Request,
    request_body: AnalyzeRequest,
    settings: Settings = Depends(get_settings),
    user: Optional[User] = Depends(get_optional_user)
):
    """智能访谈第一阶段：分析用户想法，生成关键问题列表"""
    # 获取客户端IP地址
    client_ip = request.client.host if request.client else "unknown"

    prompt_service = PromptService(settings)
    return await prompt_service.analyze_idea(request_body, user, client_ip)


@router.post("/synthesize", response_model=SynthesizeResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def synthesize_prompt(
    request: Request,
    request_body: SynthesizeRequest,  
    settings: Settings = Depends(get_settings),
    user: Optional[User] = Depends(get_optional_user)
):
    """智能访谈第三阶段：合成最终的专家级提示词"""
    # 获取客户端IP地址
    client_ip = request.client.host if request.client else "unknown"

    prompt_service = PromptService(settings)
    return await prompt_service.synthesize_prompt(request_body, user, client_ip)
