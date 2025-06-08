"""
提示词优化服务
处理提示词优化的业务逻辑
"""
from fastapi import HTTPException

from ..config import Settings
from ..constants import SUPPORTED_MODELS, get_meta_prompt_template
from ..models import PromptRequest, PromptResponse
from .llm_service import LLMService


class PromptService:
    """提示词优化服务类"""
    
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
    
    def format_prompt_template(self, original_prompt: str, model: str) -> str:
        """根据模型类型格式化对应的元提示词模板"""
        template = get_meta_prompt_template(model)
        return template.format(user_input_prompt=original_prompt)
    
    async def optimize_prompt(self, original_prompt: str, model: str) -> PromptResponse:
        """优化提示词"""
        try:
            # 验证模型
            self.validate_model(model)

            # 根据模型类型格式化对应的元提示词模板
            formatted_content = self.format_prompt_template(original_prompt, model)
            
            # 创建消息列表
            messages = self.llm_service.create_messages(formatted_content)
            
            # 调用LLM API
            optimized_prompt_content = await self.llm_service.call_llm_api(model, messages)
            
            # 返回优化结果
            return PromptResponse(
                optimized_prompt=optimized_prompt_content,
                model_used=model
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            error_detail = f"未知错误: {str(e)}"
            if model.startswith("gemini-"):
                error_detail = f"Gemini模型调用失败: {str(e)}"
            print(f"错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)


