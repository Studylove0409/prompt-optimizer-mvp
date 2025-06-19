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
        prompt_template = """你是一位智能AI助手，具备强大的分析和推理能力。请对用户的问题给出详细、准确、有用的回答。

**重要要求：**
1. 请提供完整、详尽的回答，不要匆忙结束
2. 确保回答的每个部分都充分展开和解释
3. 如果问题涉及多个方面，请逐一详细回答
4. 提供具体的例子、步骤或解决方案
5. 确保回答具有实用价值和可操作性

**用户问题：**
{user_prompt}

请给出完整详细的回答："""

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
        thinking_process = "✅ AI分析完成"
        
        # 检查回答是否可能被截断
        is_truncated = self._check_if_truncated(final_answer)
        if is_truncated:
            thinking_process = "⚠️ 回答可能未完整，建议重新生成"
            print("警告：检测到回答可能被截断")
        
        print(f"解析结果 - 最终回答长度: {len(final_answer)}")
        
        return {
            "thinking_process": thinking_process,
            "final_answer": final_answer
        }
    
    def _check_if_truncated(self, text: str) -> bool:
        """检查文本是否可能被截断"""
        if not text:
            return False
        
        # 检查常见的截断迹象
        truncation_indicators = [
            # 句子未完成
            text.rstrip().endswith(('.', '。', '!', '！', '?', '？', ':', '：', ';', '；')) == False,
            # 以数字或字母结尾（可能是列表项被截断）
            text.rstrip()[-1:].isalnum(),
            # 以标点符号结尾但不是句号等完整句子标点
            text.rstrip().endswith((',', '，', '-', '、')),
            # 长度过短（少于50字符可能是被严重截断）
            len(text.strip()) < 50
        ]
        
        # 如果有任何截断指标为True，认为可能被截断
        return any(truncation_indicators)
    
    
    async def generate_answer(self, prompt: str, model: str = "gemini-2.0-flash") -> Dict[str, Any]:
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
            
            # 调用LLM API (快速回答模式，降低token限制提高速度)
            response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=8000)
            
            if not response:
                raise HTTPException(
                    status_code=500,
                    detail="AI模型返回空响应"
                )
            
            # 添加调试信息
            print(f"快速回答响应长度: {len(response)}")
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