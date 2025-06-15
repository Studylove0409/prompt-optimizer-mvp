"""
提示词优化服务
处理提示词优化的业务逻辑
"""
from fastapi import HTTPException
from typing import Optional
import hashlib
import uuid
import json
import re

from ..config import Settings
from ..constants import SUPPORTED_MODELS, get_meta_prompt_template, get_prompt_template_by_mode, ANALYZER_PROMPT_TEMPLATE, SYNTHESIZER_PROMPT_TEMPLATE
from ..models import PromptRequest, PromptResponse, AnalyzeRequest, AnalyzeResponse, SynthesizeRequest, SynthesizeResponse, QuestionItem
from ..auth import User
from .llm_service import LLMService
from .supabase_service import SupabaseService


class PromptService:
    """提示词优化服务类"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.llm_service = LLMService(settings)
        self.supabase_service = SupabaseService(settings)
    
    def validate_model(self, model: str) -> None:
        """验证模型选择"""
        if model not in SUPPORTED_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"无效的模型选择。支持的模型: {', '.join(SUPPORTED_MODELS)}"
            )
    
    def format_prompt_template(self, original_prompt: str, model: str, mode: str = "general") -> str:
        """根据模型类型和模式格式化对应的元提示词模板
        
        Args:
            original_prompt: 用户原始提示词
            model: 使用的模型名称
            mode: 模式名称，可选值: general, business, drawing, academic
            
        Returns:
            格式化后的提示词模板
        """
        # 根据模式获取对应的提示词模板
        template = get_prompt_template_by_mode(mode)
        return template.format(user_input_prompt=original_prompt)
    
    async def optimize_prompt(self, request: PromptRequest, user: Optional[User] = None, client_ip: str = "unknown") -> PromptResponse:
        """优化提示词"""
        try:
            # 验证模型
            self.validate_model(request.model)

            # 根据模型类型和模式格式化对应的元提示词模板
            formatted_content = self.format_prompt_template(
                request.original_prompt, 
                request.model,
                request.mode
            )
            
            # 创建消息列表
            messages = self.llm_service.create_messages(formatted_content)
            
            # 调用LLM API
            optimized_prompt = await self.llm_service.call_llm_api(request.model, messages)

            # 保存历史记录（支持已登录用户和匿名用户）
            if user and user.id:
                # 已登录用户，使用用户ID保存历史记录
                await self.supabase_service.save_optimization_history(
                    user_id=str(user.id),
                    original_prompt=request.original_prompt,
                    optimized_prompt=optimized_prompt,
                    mode=request.mode
                )
            else:
                # 匿名用户，使用IP地址生成会话ID保存历史记录
                session_id = f"anonymous_{client_ip}_{hash(client_ip) % 10000}"
                await self.supabase_service.save_optimization_history(
                    session_id=session_id,
                    original_prompt=request.original_prompt,
                    optimized_prompt=optimized_prompt,
                    mode=request.mode
                )

            # 返回优化结果
            return PromptResponse(
                optimized_prompt=optimized_prompt,
                model_used=request.model
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            error_detail = f"未知错误: {str(e)}"
            if request.model.startswith("gemini-"):
                error_detail = f"Gemini模型调用失败: {str(e)}"
            print(f"错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)

    async def analyze_idea(self, request: AnalyzeRequest, user: Optional[User] = None, client_ip: str = "unknown") -> AnalyzeResponse:
        """智能访谈第一阶段：分析用户想法，生成关键问题列表"""
        try:
            # 验证模型
            self.validate_model(request.model)

            # 使用分析器提示词模板
            formatted_content = ANALYZER_PROMPT_TEMPLATE.format(user_input_prompt=request.original_idea)
            
            # 创建消息列表
            messages = self.llm_service.create_messages(formatted_content)
            
            # 调用LLM API
            response_text = await self.llm_service.call_llm_api(request.model, messages)

            # 解析JSON响应
            try:
                # 尝试直接解析JSON
                analysis_data = json.loads(response_text)
            except json.JSONDecodeError:
                # 如果解析失败，尝试提取JSON片段
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group(1))
                else:
                    # 尝试查找第一个完整的JSON对象
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        analysis_data = json.loads(json_match.group(0))
                    else:
                        # 最终备用：返回默认问题
                        analysis_data = {
                            "questions": [
                                {
                                    "key": "target_audience",
                                    "question": "您的目标受众是谁？",
                                    "type": "textarea",
                                    "placeholder": "请描述您的目标用户群体...",
                                    "required": True
                                },
                                {
                                    "key": "specific_goal",
                                    "question": "您希望达到什么具体目标？",
                                    "type": "textarea", 
                                    "placeholder": "请详细描述您的期望结果...",
                                    "required": True
                                },
                                {
                                    "key": "context_info",
                                    "question": "请提供相关背景信息或约束条件？",
                                    "type": "textarea",
                                    "placeholder": "如预算、时间、资源限制等...",
                                    "required": False
                                }
                            ],
                            "summary": "为了更好地理解您的需求，我需要了解一些关键信息。"
                        }

            # 转换为Pydantic模型
            questions = [QuestionItem(**q) for q in analysis_data.get("questions", [])]
            
            return AnalyzeResponse(
                questions=questions,
                summary=analysis_data.get("summary", ""),
                model_used=request.model
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            error_detail = f"分析阶段失败: {str(e)}"
            print(f"分析错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)

    async def synthesize_prompt(self, request: SynthesizeRequest, user: Optional[User] = None, client_ip: str = "unknown") -> SynthesizeResponse:
        """智能访谈第三阶段：合成最终的专家级提示词"""
        try:
            # 验证模型
            self.validate_model(request.model)

            # 构建用户答案文本
            answers_text = "\n".join([f"{key}: {value}" for key, value in request.user_answers.items() if value])
            
            # 使用合成器提示词模板
            formatted_content = SYNTHESIZER_PROMPT_TEMPLATE.format(
                original_idea=request.original_idea,
                user_answers=answers_text
            )
            
            # 创建消息列表
            messages = self.llm_service.create_messages(formatted_content)
            
            # 调用LLM API
            optimized_prompt = await self.llm_service.call_llm_api(request.model, messages)

            # 保存历史记录（支持已登录用户和匿名用户）
            if user and user.id:
                # 已登录用户，使用用户ID保存历史记录
                await self.supabase_service.save_optimization_history(
                    user_id=str(user.id),
                    original_prompt=request.original_idea,
                    optimized_prompt=optimized_prompt,
                    mode="expert"
                )
            else:
                # 匿名用户，使用IP地址生成会话ID保存历史记录
                session_id = f"anonymous_{client_ip}_{hash(client_ip) % 10000}"
                await self.supabase_service.save_optimization_history(
                    session_id=session_id,
                    original_prompt=request.original_idea,
                    optimized_prompt=optimized_prompt,
                    mode="expert"
                )

            return SynthesizeResponse(
                optimized_prompt=optimized_prompt,
                model_used=request.model
            )
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            error_detail = f"合成阶段失败: {str(e)}"
            print(f"合成错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)


