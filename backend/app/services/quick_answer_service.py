"""
快速回答服务
处理基于优化提示词的快速回答生成逻辑
"""
import re
from typing import Dict, Any
from fastapi import HTTPException

from ..config import Settings
from ..constants import API_TIMEOUT, API_TEMPERATURE, API_MAX_TOKENS
from .llm_service import LLMService


class QuickAnswerService:
    """快速回答服务类"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.llm_service = LLMService(settings)
    
    def _create_prompt(self, user_prompt: str) -> str:
        """
        创建快速回答的提示词
        
        Args:
            user_prompt: 用户的原始提示词
        
        Returns:
            完整的提示词
        """
        prompt_template = """你是一位专业的AI助手。请对用户的问题给出准确、实用的回答。

**回答要求：**
1. 直接回答核心问题，提供有效的解决方案
2. 使用清晰的结构和逻辑层次
3. 包含具体的步骤或实例
4. 重点突出实用性和可操作性

**内容要求：**
- 提供精准的分析和解释
- 包含具体的例子或解决方案
- 使用标题、要点和段落结构化内容
- 控制内容长度，确保高质量和高效率

**字数限制：**
- 回答字数控制在3,000-8,000字之间
- 确保内容精炼而有价值
- 优先回答核心问题

**用户问题：**
{user_prompt}

请给出精准高效的回答："""

        return prompt_template.format(user_prompt=user_prompt)
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """
        解析响应内容
        
        Args:
            response: LLM的原始响应
        
        Returns:
            包含thinking_process和final_answer的字典
        """
        # 直接将整个响应作为最终答案，无需思考过程
        final_answer = response.strip()
        
        # 快速字数统计，避免多次字符串替换
        response_length = len(response)
        thinking_process = f"✅ AI分析完成（字数：{response_length}）"
        
        return {
            "thinking_process": thinking_process,
            "final_answer": final_answer
        }
    
    
    
    async def generate_answer(self, prompt: str, model: str = "deepseek-chat") -> Dict[str, Any]:
        """
        生成快速回答
        
        Args:
            prompt: 用户的提示词
            model: 使用的模型
        
        Returns:
            包含思维过程、最终答案和使用模型的字典
        """
        try:
            # 验证输入
            if not prompt or not prompt.strip():
                raise ValueError("提示词不能为空")
            
            # 创建快速回答提示词
            quick_prompt = self._create_prompt(prompt.strip())
            
            # 创建消息列表
            messages = [
                {
                    "role": "user",
                    "content": quick_prompt
                }
            ]
            
            # 调用LLM API (快速回答模式，使用合理的token限制保证速度)
            max_tokens = 12000
            print(f"开始调用快速回答API，模型: {model}，max_tokens: {max_tokens}")
            response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=max_tokens)
            
            if not response:
                print("错误：API返回空响应")
                raise HTTPException(
                    status_code=500,
                    detail="AI模型返回空响应"
                )
            
            print(f"API调用成功，响应长度: {len(response)} 字符")
            
            # 解析响应
            parsed_result = self._parse_response(response)
            
            return {
                "thinking_process": parsed_result["thinking_process"],
                "final_answer": parsed_result["final_answer"],
                "model_used": model
            }
            
        except ValueError as e:
            raise e
        except Exception as e:
            print(f"快速回答生成错误: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"快速回答生成失败: {str(e)}"
            )