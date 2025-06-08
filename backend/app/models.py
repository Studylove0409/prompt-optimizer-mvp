"""
Pydantic数据模型定义
"""
from pydantic import BaseModel
from .constants import DEFAULT_MODEL


class PromptRequest(BaseModel):
    """提示词优化请求模型"""
    original_prompt: str
    model: str = DEFAULT_MODEL


class PromptResponse(BaseModel):
    """提示词优化响应模型"""
    optimized_prompt: str
    model_used: str


class AnswerRequest(BaseModel):
    """获取答案请求模型"""
    prompt: str
    model: str = DEFAULT_MODEL


class AnswerResponse(BaseModel):
    """获取答案响应模型"""
    answer: str
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
