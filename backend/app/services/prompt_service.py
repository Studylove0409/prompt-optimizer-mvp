"""
提示词优化服务
处理提示词优化的业务逻辑
"""
from fastapi import HTTPException
from typing import Optional
import json
import re

from ..config import Settings
from ..constants import SUPPORTED_MODELS, get_meta_prompt_template, get_prompt_template_by_mode, get_thinking_optimization_template
from ..models import PromptRequest, PromptResponse, ThinkingAnalysisResponse, ThinkingOptimizationRequest, QuickOptionsRequest, QuickOptionsResponse
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

    def _extract_json_from_response(self, response_text: str) -> list:
        """从AI响应中提取JSON数据"""
        try:
            # 尝试直接解析整个响应
            return json.loads(response_text)
        except json.JSONDecodeError:
            # 如果直接解析失败，尝试提取JSON部分
            json_pattern = r'\[.*?\]'
            matches = re.findall(json_pattern, response_text, re.DOTALL)

            for match in matches:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue

            # 如果都失败了，返回空列表
            print(f"无法从响应中提取JSON: {response_text}")
            return []

    async def analyze_thinking_prompt(self, request: PromptRequest, user: Optional[User] = None, client_ip: str = "unknown") -> ThinkingAnalysisResponse:
        """思考模式第一阶段：分析提示词缺失信息"""
        try:
            # 验证模型
            self.validate_model(request.model)

            # 使用思考模式的分析模板
            formatted_content = self.format_prompt_template(
                request.original_prompt,
                request.model,
                "thinking"  # 使用思考模式
            )

            # 创建消息列表（不使用系统消息，直接使用用户消息）
            messages = [
                {
                    "role": "user",
                    "content": formatted_content
                }
            ]

            # 调用LLM API（思考模式分析阶段使用标准token限制）
            response_text = await self.llm_service.call_llm_api(request.model, messages)

            # 提取JSON数据
            analysis_result = self._extract_json_from_response(response_text)

            # 返回分析结果
            return ThinkingAnalysisResponse(
                analysis_result=analysis_result,
                original_prompt=request.original_prompt
            )

        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            error_detail = f"思考模式分析失败: {str(e)}"
            print(f"错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)

    async def optimize_thinking_prompt(self, request: ThinkingOptimizationRequest, user: Optional[User] = None, client_ip: str = "unknown") -> PromptResponse:
        """思考模式第二阶段：基于补充信息优化提示词"""
        try:
            # 验证模型
            self.validate_model(request.model)

            # 格式化补充信息
            additional_info_text = ""
            for key, value in request.additional_info.items():
                if value and str(value).strip():  # 只包含非空的信息
                    additional_info_text += f"{key}: {value}\n"

            # 使用思考模式的优化模板
            template = get_thinking_optimization_template()
            formatted_content = template.format(
                original_prompt=request.original_prompt,
                additional_info=additional_info_text
            )

            # 创建消息列表（不使用系统消息，直接使用用户消息）
            messages = [
                {
                    "role": "user",
                    "content": formatted_content
                }
            ]

            # 调用LLM API（思考模式最终优化阶段使用更高token限制）
            optimized_prompt = await self.llm_service.call_llm_api_thinking(request.model, messages)

            # 保存历史记录（支持已登录用户和匿名用户）
            if user and user.id:
                # 已登录用户，使用用户ID保存历史记录
                await self.supabase_service.save_optimization_history(
                    user_id=str(user.id),
                    original_prompt=request.original_prompt,
                    optimized_prompt=optimized_prompt,
                    mode="thinking"
                )
            else:
                # 匿名用户，使用IP地址生成会话ID保存历史记录
                session_id = f"anonymous_{client_ip}_{hash(client_ip) % 10000}"
                await self.supabase_service.save_optimization_history(
                    session_id=session_id,
                    original_prompt=request.original_prompt,
                    optimized_prompt=optimized_prompt,
                    mode="thinking"
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
            error_detail = f"思考模式优化失败: {str(e)}"
            print(f"错误详情: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)
    
    async def generate_quick_options(self, request: QuickOptionsRequest, user: Optional[User] = None, client_ip: str = "unknown") -> QuickOptionsResponse:
        """使用Gemini生成快速选择选项"""
        try:
            # 构建Gemini的提示词
            system_prompt = """你是一个专业的UI/UX设计师和用户体验专家。你的任务是为给定的表单字段问题生成3-5个最相关、实用的快速选择选项。

要求：
1. 选项要简洁明了，每个选项不超过8个字符
2. 选项要实用且符合中国用户习惯
3. 选项要有明显区别，不能重复或相似
4. 选项要按照重要性或常用程度排序
5. 返回纯文本，每行一个选项，不要序号或特殊符号
6. 最多返回5个选项"""

            user_prompt = f"""字段名称：{request.field_key}
问题描述：{request.question}

请为这个问题生成适合的快速选择选项："""

            # 构建消息列表
            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": user_prompt
                }
            ]
            
            # 调用Gemini API - 使用支持的模型
            response = await self.llm_service.call_llm_api("gemini-2.0-flash", messages)
            
            # 解析返回的选项
            options_text = response.strip()
            options = [option.strip() for option in options_text.split('\n') if option.strip()]
            
            # 确保至少有3个选项，最多5个选项
            if len(options) < 3:
                # 如果选项太少，添加一些通用选项
                default_options = ["基础", "中等", "高级"]
                options.extend(default_options[:3-len(options)])
            elif len(options) > 5:
                # 如果选项太多，只取前5个
                options = options[:5]
            
            return QuickOptionsResponse(
                options=options,
                field_key=request.field_key,
                question=request.question
            )
            
        except HTTPException:
            raise
        except Exception as e:
            error_detail = f"生成快速选项失败: {str(e)}"
            print(f"错误详情: {error_detail}")
            # 失败时返回默认选项
            return QuickOptionsResponse(
                options=["基础水平", "中等水平", "高级水平", "专家水平", "其他"],
                field_key=request.field_key,
                question=request.question
            )


