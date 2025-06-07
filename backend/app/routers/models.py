"""
模型相关路由
"""
from fastapi import APIRouter

from ..constants import MODEL_INFO, DEFAULT_MODEL
from ..models import ModelsResponse, ModelInfo

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models", response_model=ModelsResponse)
async def get_available_models():
    """获取可用的模型列表"""
    models = [ModelInfo(**model) for model in MODEL_INFO]
    return ModelsResponse(models=models, default=DEFAULT_MODEL)
