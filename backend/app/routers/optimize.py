"""
提示词优化路由
"""
from fastapi import APIRouter, Depends

from ..config import get_settings, Settings
from ..models import PromptRequest, PromptResponse, AnswerRequest, AnswerResponse
from ..services.prompt_service import PromptService

router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/optimize", response_model=PromptResponse)
async def optimize_prompt(
    request_body: PromptRequest,
    settings: Settings = Depends(get_settings)
):
    """优化提示词的API端点"""
    prompt_service = PromptService(settings)
    return await prompt_service.optimize_prompt(request_body)


@router.post("/get-answer", response_model=AnswerResponse)
async def get_answer(
    request_body: AnswerRequest,
    settings: Settings = Depends(get_settings)
):
    """获取AI答案的API端点"""
    prompt_service = PromptService(settings)
    return await prompt_service.get_answer(request_body)
