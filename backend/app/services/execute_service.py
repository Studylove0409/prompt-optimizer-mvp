"""
执行服务 - 处理优化后提示词的AI回答
"""
from fastapi import HTTPException

from ..config import Settings
from ..models import ExecuteRequest, ExecuteResponse
from ..constants import SUPPORTED_MODELS
from .llm_service import LLMService


class ExecuteService:
    """执行服务类 - 处理优化后提示词的AI回答"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.llm_service = LLMService(settings)
    
    def validate_model(self, model: str) -> None:
        """验证模型选择"""
        if model not in SUPPORTED_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"无效的模型选择。支持的模型: {', '.join(SUPPORTED_MODELS)}"
            )
    
    def create_execution_messages(self, optimized_prompt: str) -> list:
        """创建执行消息列表"""
        return [
            {
                "role": "system",
                "content": "你是一个专业的AI助手。请根据用户提供的提示词，给出准确、有用、详细的回答。"
            },
            {
                "role": "user",
                "content": optimized_prompt
            }
        ]
    
    async def execute_prompt(self, request: ExecuteRequest) -> ExecuteResponse:
        """执行优化后的提示词，获取AI回答"""
        try:
            # 验证模型
            self.validate_model(request.model)
            
            # 创建消息列表
            messages = self.create_execution_messages(request.optimized_prompt)
            
            # 调用LLM API获取回答
            ai_response = await self.llm_service.call_llm_api(request.model, messages)
            
            # 返回执行结果
            return ExecuteResponse(
                ai_response=ai_response,
                model_used=request.model
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他异常
            raise HTTPException(
                status_code=500,
                detail=f"执行提示词时发生错误: {str(e)}"
            )
