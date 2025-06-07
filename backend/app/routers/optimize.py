"""
提示词优化路由
"""
from fastapi import APIRouter, Depends, Request

from ..config import get_settings, Settings
from ..models import PromptRequest, PromptResponse
from ..services.prompt_service import PromptService
from ..rate_limit import get_optimize_rate_limiter, handle_rate_limit_error

router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/optimize", response_model=PromptResponse)
async def optimize_prompt(
    request_body: PromptRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    ratelimit: dict = Depends(get_optimize_rate_limiter())
):
    """
    优化提示词的API端点

    速率限制：每分钟最多10次请求（基于IP地址）
    """
    try:
        prompt_service = PromptService(settings)
        return await prompt_service.optimize_prompt(request_body)
    except Exception as e:
        # 处理速率限制错误
        handle_rate_limit_error(e)
