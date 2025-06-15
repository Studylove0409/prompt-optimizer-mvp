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
        print(f"[分析阶段] 开始分析用户想法: {request.original_idea[:100]}...")
        
        try:
            # 验证模型
            self.validate_model(request.model)

            # 使用分析器提示词模板
            formatted_content = ANALYZER_PROMPT_TEMPLATE.format(user_input_prompt=request.original_idea)
            print(f"[分析阶段] 使用模型: {request.model}")
            
            # 创建消息列表
            messages = self.llm_service.create_messages(formatted_content)
            
            # 调用LLM API
            response_text = await self.llm_service.call_llm_api(request.model, messages)
            print(f"[分析阶段] LLM原始响应长度: {len(response_text)}")
            print(f"[分析阶段] LLM原始响应前500字符: {response_text[:500]}")

            # 强化的JSON解析逻辑
            analysis_data = self._parse_analysis_response(response_text)
            print(f"[分析阶段] 解析结果: 问题数量={len(analysis_data.get('questions', []))}")

            # 验证和清理数据
            questions_data = analysis_data.get("questions", [])
            if not isinstance(questions_data, list):
                print(f"[分析阶段] 警告: questions不是列表格式，使用备用问题")
                questions_data = self._get_fallback_questions(request.original_idea)
            
            # 转换为Pydantic模型，增加错误处理
            questions = []
            for i, q in enumerate(questions_data):
                try:
                    # 确保必要字段存在
                    question_item = QuestionItem(
                        key=q.get("key", f"question_{i+1}"),
                        question=q.get("question", f"请提供更多关于您想法的信息（问题{i+1}）"),
                        type=q.get("type", "textarea"),
                        placeholder=q.get("placeholder", "请输入..."),
                        required=q.get("required", True)
                    )
                    questions.append(question_item)
                except Exception as e:
                    print(f"[分析阶段] 警告: 处理问题{i+1}时出错: {e}")
                    # 跳过有问题的项目，继续处理其他问题
                    continue
            
            # 如果没有有效问题，使用备用问题
            if not questions:
                print(f"[分析阶段] 没有有效问题，使用备用问题")
                fallback_data = self._get_fallback_questions(request.original_idea)
                questions = [QuestionItem(**q) for q in fallback_data]
            
            result = AnalyzeResponse(
                questions=questions,
                summary=analysis_data.get("summary", "为了更好地理解您的需求，我需要了解一些关键信息。"),
                model_used=request.model
            )
            
            print(f"[分析阶段] 成功返回 {len(questions)} 个问题")
            return result
            
        except HTTPException:
            # 重新抛出HTTP异常
            raise
        except Exception as e:
            # 处理其他未知错误
            print(f"[分析阶段] 发生未知错误: {str(e)}")
            print(f"[分析阶段] 错误类型: {type(e).__name__}")
            
            # 返回备用响应而不是抛出错误
            fallback_questions = self._get_fallback_questions(request.original_idea)
            questions = [QuestionItem(**q) for q in fallback_questions]
            
            return AnalyzeResponse(
                questions=questions,
                summary="系统遇到了一些问题，但我们为您准备了一些通用问题来完善您的想法。",
                model_used=request.model
            )

    def _parse_analysis_response(self, response_text: str) -> dict:
        """强化的JSON响应解析逻辑"""
        print(f"[JSON解析] 开始解析响应...")
        
        # 方法1: 直接解析
        try:
            analysis_data = json.loads(response_text.strip())
            print(f"[JSON解析] 方法1成功: 直接解析")
            return analysis_data
        except json.JSONDecodeError as e:
            print(f"[JSON解析] 方法1失败: {e}")

        # 方法2: 提取代码块中的JSON
        json_patterns = [
            r'```json\s*(\{.*?\})\s*```',  # 标准markdown代码块
            r'```\s*(\{.*?\})\s*```',      # 无语言标识的代码块
            r'`(\{.*?\})`',                # 单反引号
        ]
        
        for i, pattern in enumerate(json_patterns, 2):
            try:
                json_match = re.search(pattern, response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group(1))
                    print(f"[JSON解析] 方法{i}成功: 提取代码块")
                    return analysis_data
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"[JSON解析] 方法{i}失败: {e}")
                continue

        # 方法3: 查找第一个完整的JSON对象
        try:
            # 查找以{开始的位置
            start_pos = response_text.find('{')
            if start_pos != -1:
                # 从该位置开始尝试解析JSON
                json_text = response_text[start_pos:]
                # 找到对应的结束位置
                brace_count = 0
                end_pos = -1
                for i, char in enumerate(json_text):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_pos = i + 1
                            break
                
                if end_pos != -1:
                    json_candidate = json_text[:end_pos]
                    analysis_data = json.loads(json_candidate)
                    print(f"[JSON解析] 方法5成功: 手动提取JSON对象")
                    return analysis_data
        except (json.JSONDecodeError, Exception) as e:
            print(f"[JSON解析] 方法5失败: {e}")

        # 方法4: 使用正则表达式更宽松地匹配
        try:
            # 查找看起来像JSON的文本块
            json_match = re.search(r'\{[^{}]*"questions"[^{}]*\[[^\]]*\][^{}]*\}', response_text, re.DOTALL)
            if json_match:
                analysis_data = json.loads(json_match.group(0))
                print(f"[JSON解析] 方法6成功: 宽松匹配")
                return analysis_data
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"[JSON解析] 方法6失败: {e}")

        print(f"[JSON解析] 所有方法都失败，返回空字典")
        return {}

    def _get_fallback_questions(self, original_idea: str) -> list:
        """根据用户想法生成备用问题"""
        print(f"[备用问题] 为用户想法生成备用问题: {original_idea[:50]}...")
        
        # 根据关键词优化问题
        idea_lower = original_idea.lower()
        
        if any(keyword in idea_lower for keyword in ['报告', '分析', '研究', '调研']):
            return [
                {
                    "key": "target_subject",
                    "question": "请明确要分析或研究的具体对象",
                    "type": "text",
                    "placeholder": "例如：某个产品、市场、行业或现象",
                    "required": True
                },
                {
                    "key": "analysis_scope",
                    "question": "希望重点关注哪些方面？",
                    "type": "textarea",
                    "placeholder": "例如：市场规模、竞争格局、发展趋势、用户需求等",
                    "required": True
                },
                {
                    "key": "target_audience",
                    "question": "这份报告的目标受众是谁？",
                    "type": "textarea",
                    "placeholder": "例如：公司高管、投资人、学术研究、个人决策等",
                    "required": True
                },
                {
                    "key": "time_scope",
                    "question": "分析的时间范围和深度要求",
                    "type": "textarea",
                    "placeholder": "例如：近3年数据、未来5年预测、季度报告等",
                    "required": False
                }
            ]
        elif any(keyword in idea_lower for keyword in ['文章', '内容', '写作', '创作']):
            return [
                {
                    "key": "content_topic",
                    "question": "请明确文章的具体主题和角度",
                    "type": "textarea",
                    "placeholder": "例如：要讨论的核心观点、想要传达的信息等",
                    "required": True
                },
                {
                    "key": "target_readers",
                    "question": "目标读者群体是谁？",
                    "type": "textarea",
                    "placeholder": "例如：专业人士、普通大众、学生、特定行业从业者等",
                    "required": True
                },
                {
                    "key": "content_style",
                    "question": "希望采用什么样的写作风格和格式？",
                    "type": "textarea",
                    "placeholder": "例如：学术严谨、通俗易懂、新闻报道、个人感悟等",
                    "required": True
                }
            ]
        else:
            # 通用问题
            return [
                {
                    "key": "specific_goal",
                    "question": "您希望达到什么具体目标？",
                    "type": "textarea",
                    "placeholder": "请详细描述您的期望结果...",
                    "required": True
                },
                {
                    "key": "target_audience",
                    "question": "您的目标受众是谁？",
                    "type": "textarea",
                    "placeholder": "请描述您的目标用户群体...",
                    "required": True
                },
                {
                    "key": "context_constraints",
                    "question": "有什么特殊要求或限制条件吗？",
                    "type": "textarea",
                    "placeholder": "例如：时间限制、资源约束、格式要求等",
                    "required": False
                }
            ]

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


