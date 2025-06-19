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

**严格要求：**
1. 回答字数必须严格控制在1000-5000字之间
2. 不要超出5000字，一旦接近5000字立即结束回答
3. 直接回答核心问题，提供关键要点和实用建议
4. 使用清晰的结构：标题、要点列举、具体例子
5. 确保内容精炼有用，避免冗余重复

**重要提醒：请严格控制字数，不要超过5000字！**

**用户问题：**
{user_prompt}

请给出详细回答（严格控制在1000-5000字内）："""

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
        
        text_length = len(text)
        
        # 检查是否过长（超过6000字符违反要求）
        if text_length > 6000:
            print(f"警告：回答过长 ({text_length} 字符)，超出5000字要求")
            return True
        
        # 检查是否过短（少于800字符可能未达到1000字要求）
        if text_length < 800:
            print(f"警告：回答过短 ({text_length} 字符)，可能被截断")
            return True
        
        # 检查常见的截断迹象
        truncation_indicators = [
            # 句子未完成
            text.rstrip().endswith(('.', '。', '!', '！', '?', '？', ':', '：', ';', '；')) == False,
            # 以数字或字母结尾（可能是列表项被截断）
            text.rstrip()[-1:].isalnum(),
            # 以标点符号结尾但不是句号等完整句子标点
            text.rstrip().endswith((',', '，', '-', '、'))
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
            
            # 调用LLM API (快速回答模式，严格的token限制确保不超过5000字)
            response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=5500)
            
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