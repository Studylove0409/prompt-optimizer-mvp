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
        prompt_template = """你是一位专业的AI助手。请对用户的问题给出详细、准确、实用的回答。

**回答要求：**
1. 确保内容详细充实，提供全面深入的分析
2. 直接回答核心问题，提供完整的解决方案
3. 使用清晰的结构和逻辑层次
4. 可以包含详细的步骤、案例和实例
5. 提供尽可能完整和全面的信息

**内容要求：**
- 提供深入的分析和详细的解释
- 包含具体的例子、步骤或解决方案
- 使用标题、要点和段落结构化内容
- 重点突出实用性和可操作性
- 可以包含详细的背景知识和扩展信息
- 如有必要，可以提供多个角度的分析

**字数限制：**
- 回答字数请严格控制在30,000字以内
- 确保在字数限制内提供最有价值的信息
- 优先回答核心问题，然后补充细节

**用户问题：**
{user_prompt}

请给出详细完整的回答（不超过30,000字）："""

        return prompt_template.format(user_prompt=user_prompt)
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """
        解析响应内容
        
        Args:
            response: LLM的原始响应
        
        Returns:
            包含thinking_process和final_answer的字典
        """
        print(f"快速回答响应长度: {len(response)}")
        
        # 直接将整个响应作为最终答案，无需思考过程
        final_answer = response.strip()
        
        # 统计实际字数（去除空格和标点的字符数）
        word_count = len(response.replace(' ', '').replace('\n', '').replace('\t', ''))
        print(f"实际字数统计: {word_count}")
        
        thinking_process = f"✅ AI分析完成（字数：{word_count}）"
        
        print(f"解析结果 - 最终回答长度: {len(final_answer)}")
        
        return {
            "thinking_process": thinking_process,
            "final_answer": final_answer
        }
    
    
    
    async def generate_answer(self, prompt: str, model: str = "gemini-2.5-flash-lite-preview-06-17") -> Dict[str, Any]:
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
            
            # 调用LLM API (快速回答模式，使用50000 tokens支持长回答)
            max_tokens = 50000
            print(f"开始调用快速回答API，模型: {model}，max_tokens: {max_tokens}")
            response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=max_tokens)
            
            if not response:
                print("错误：API返回空响应")
                raise HTTPException(
                    status_code=500,
                    detail="AI模型返回空响应"
                )
            
            print(f"API调用成功，响应长度: {len(response)} 字符")
            print(f"响应前200字符: {response[:200]}...")
            if len(response) > 200:
                print(f"响应后100字符: ...{response[-100:]}")
            
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