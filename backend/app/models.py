"""
Pydantic数据模型定义
"""
from pydantic import BaseModel, Field
from .constants import DEFAULT_MODEL


class PromptRequest(BaseModel):
    """提示词优化请求模型"""
    original_prompt: str = Field(..., max_length=2000, description="原始提示词，最大长度2000")
    model: str = DEFAULT_MODEL
    mode: str = "general"  # 可选值: general, business, drawing, academic, thinking


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


class ThinkingAnalysisResponse(BaseModel):
    """思考模式分析响应模型"""
    analysis_result: list[dict]  # 分析结果的JSON列表
    original_prompt: str


class ThinkingOptimizationRequest(BaseModel):
    """思考模式优化请求模型"""
    original_prompt: str = Field(..., max_length=2000, description="原始提示词")
    additional_info: dict = Field(..., description="用户补充的关键信息")
    model: str = DEFAULT_MODEL


class KeyInfoItem(BaseModel):
    """关键信息项模型"""
    key: str = Field(..., description="关键信息点名称")
    question: str = Field(..., description="引导性问题")


class QuickOptionsRequest(BaseModel):
    """快速选择选项生成请求模型"""
    field_key: str = Field(..., description="字段关键字")
    question: str = Field(..., description="问题描述")
    model: str = "gemini-2.0-flash"


class QuickOptionsResponse(BaseModel):
    """快速选择选项生成响应模型"""
    options: list[str] = Field(..., description="生成的快速选择选项")
    field_key: str
    question: str


class QuickAnswerRequest(BaseModel):
    """快速回答请求模型"""
    prompt: str = Field(..., max_length=5000, description="优化后的提示词")
    model: str = "gemini-2.5-pro-preview-03-25"


class QuickAnswerResponse(BaseModel):
    """快速回答响应模型"""
    thinking_process: str = Field(..., description="AI的思维过程")
    final_answer: str = Field(..., description="最终回答")
    model_used: str = Field(..., description="使用的模型")
    success: bool = True
