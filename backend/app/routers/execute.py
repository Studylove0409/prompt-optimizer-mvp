"""
执行路由 - 处理优化后提示词的AI回答
"""
from fastapi import APIRouter, Depends

from ..config import get_settings, Settings
from ..models import ExecuteRequest, ExecuteResponse
from ..services.execute_service import ExecuteService

router = APIRouter(prefix="/api", tags=["execute"])


@router.post("/execute", response_model=ExecuteResponse)
async def execute_prompt(
    request_body: ExecuteRequest,
    settings: Settings = Depends(get_settings)
):
    """执行优化后提示词的API端点"""
    execute_service = ExecuteService(settings)
    return await execute_service.execute_prompt(request_body)
