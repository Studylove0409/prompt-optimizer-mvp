"""
提示词优化路由
"""
from fastapi import APIRouter, Depends, Request

from ..main import limiter
from ..config import get_settings, Settings
from ..models import PromptRequest, PromptResponse
from ..services.prompt_service import PromptService

router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/optimize", response_model=PromptResponse)
@limiter.limit(lambda: get_settings().rate_limit)
async def optimize_prompt(
    request: Request,
    request_body: PromptRequest,
    settings: Settings = Depends(get_settings)
):
    """优化提示词的API端点"""
    prompt_service = PromptService(settings)
    return await prompt_service.optimize_prompt(request_body)
