"""
Pydantic数据模型定义
"""
from pydantic import BaseModel, Field
from .constants import DEFAULT_MODEL


class PromptRequest(BaseModel):
    """提示词优化请求模型"""
    original_prompt: str = Field(..., max_length=1000, description="原始提示词，最大长度1000")
    model: str = DEFAULT_MODEL
    mode: str = "general"  # 可选值: general, business, drawing, academic


class PromptResponse(BaseModel):
    """提示词优化响应模型"""
    optimized_prompt: str
    model_used: str


class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str


class ModelInfo(BaseModel):
    """模型信息模型"""
    id: str
    name: str
    description: str
    speed: str


class ModelsResponse(BaseModel):
    """模型列表响应模型"""
    models: list[ModelInfo]
    default: str


class APIResponse(BaseModel):
    """通用API响应模型"""
    message: str
    version: str
