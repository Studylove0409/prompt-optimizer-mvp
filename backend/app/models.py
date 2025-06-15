"""
Pydantic数据模型定义
"""
from pydantic import BaseModel, Field
from .constants import DEFAULT_MODEL


class PromptRequest(BaseModel):
    """提示词优化请求模型"""
    original_prompt: str = Field(..., max_length=2000, description="原始提示词，最大长度2000")
    model: str = DEFAULT_MODEL
    mode: str = "general"  # 可选值: general, business, drawing, academic, expert


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


class QuestionItem(BaseModel):
    """智能访谈问题项模型"""
    key: str = Field(..., description="问题标识符")
    question: str = Field(..., description="具体问题")
    type: str = Field(default="textarea", description="输入类型: text|textarea|select")
    placeholder: str = Field(default="请输入...", description="输入提示")
    required: bool = Field(default=True, description="是否必填")


class AnalyzeRequest(BaseModel):
    """需求分析请求模型"""
    original_idea: str = Field(..., max_length=2000, description="用户的初步想法，最大长度2000")
    model: str = DEFAULT_MODEL


class AnalyzeResponse(BaseModel):
    """需求分析响应模型"""
    questions: list[QuestionItem] = Field(..., description="缺失的关键问题点列表")
    summary: str = Field(..., description="简要分析总结")
    model_used: str


class SynthesizeRequest(BaseModel):
    """提示词合成请求模型"""
    original_idea: str = Field(..., max_length=2000, description="用户的初步想法")
    user_answers: dict = Field(..., description="用户补充的结构化信息")
    model: str = DEFAULT_MODEL


class SynthesizeResponse(BaseModel):
    """提示词合成响应模型"""
    optimized_prompt: str = Field(..., description="最终的专家级提示词")
    model_used: str
