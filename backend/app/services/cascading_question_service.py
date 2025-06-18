"""
级联问题服务
处理思考模式的智能问答逻辑
"""
from typing import Optional, Dict, List, Any
import json
import re
from ..models import ConversationHistoryItem, QuestionData, CascadingQuestionResponse
from ..constants import get_meta_prompt_template


class CascadingQuestionService:
    """级联问题服务类"""
    
    def __init__(self):
        # 问题库配置
        self.question_bank = self._init_question_bank()
        # 问题依赖关系
        self.question_dependencies = self._init_dependencies()
        # 问题优先级
        self.question_priorities = self._init_priorities()
    
    def _init_question_bank(self) -> Dict[str, QuestionData]:
        """初始化问题库"""
        return {
            "target_audience": QuestionData(
                key="target_audience",
                question="你希望这个提示词主要面向什么类型的用户？",
                type="select",
                options=["开发者/程序员", "设计师/创意工作者", "学生/研究者", "商务人士", "普通用户", "AI工程师", "其他"],
                importance="high",
                placeholder="选择目标用户群体"
            ),
            "main_goal": QuestionData(
                key="main_goal", 
                question="你希望通过这个提示词实现什么核心目标？",
                type="text",
                importance="high",
                placeholder="描述你的主要目标或期望结果"
            ),
            "output_format": QuestionData(
                key="output_format",
                question="你希望AI以什么格式回复？",
                type="select", 
                options=["详细文本", "结构化列表", "代码示例", "步骤指南", "创意内容", "分析报告", "对话形式", "其他"],
                importance="medium",
                placeholder="选择期望的输出格式"
            ),
            "context_background": QuestionData(
                key="context_background",
                question="能否补充一些背景信息或使用场景？",
                type="text",
                importance="medium",
                placeholder="描述使用环境、背景情况或相关上下文"
            ),
            "tone_style": QuestionData(
                key="tone_style",
                question="你希望AI用什么语调和风格回复？",
                type="select",
                options=["专业正式", "友好亲切", "简洁直接", "详细解释", "创意有趣", "学术严谨", "实用导向", "其他"],
                importance="medium",
                placeholder="选择期望的语调风格"
            ),
            "technical_level": QuestionData(
                key="technical_level",
                question="你的技术水平或专业背景如何？",
                type="select",
                options=["初学者", "有一定经验", "较为熟练", "专业级别", "专家水平"],  
                importance="medium",
                placeholder="选择你的技术水平"
            ),
            "specific_requirements": QuestionData(
                key="specific_requirements",
                question="还有什么特殊要求或约束条件吗？",
                type="text",
                importance="low",
                placeholder="任何特殊需求、限制条件或注意事项"
            ),
            "examples_needed": QuestionData(
                key="examples_needed",
                question="你希望包含具体的示例或案例吗？",
                type="select",
                options=["是，需要详细示例", "是，需要简单示例", "不需要示例", "视情况而定"],
                importance="low",
                placeholder="选择示例需求"
            )
        }
    
    def _init_dependencies(self) -> Dict[str, Dict[str, List[str]]]:
        """初始化问题依赖关系"""
        return {
            "target_audience": {
                "开发者/程序员": ["programming_language", "experience_level"],
                "设计师/创意工作者": ["design_tool", "design_style"],
                "学生/研究者": ["academic_field", "research_level"],
                "商务人士": ["business_context", "decision_level"]
            },
            "main_goal": {
                "学习": ["learning_depth", "learning_style"],
                "创作": ["creative_direction", "inspiration_source"],
                "分析": ["analysis_scope", "analysis_depth"],
                "解决问题": ["problem_complexity", "solution_type"]
            }
        }
    
    def _init_priorities(self) -> Dict[str, int]:
        """初始化问题优先级（数字越小优先级越高）"""
        return {
            "target_audience": 1,
            "main_goal": 2,
            "output_format": 3,
            "context_background": 4,
            "tone_style": 5,
            "technical_level": 6,
            "specific_requirements": 7,
            "examples_needed": 8
        }
    
    def analyze_prompt_needs(self, original_prompt: str) -> List[str]:
        """分析提示词需要补充的信息类型"""
        prompt_lower = original_prompt.lower()
        needed_info = []
        
        # 基于关键词分析需要的信息
        if not any(word in prompt_lower for word in ["用户", "对象", "目标", "面向"]):
            needed_info.append("target_audience")
        
        if not any(word in prompt_lower for word in ["目标", "目的", "希望", "想要"]):
            needed_info.append("main_goal")
            
        if not any(word in prompt_lower for word in ["格式", "形式", "样式", "结构"]):
            needed_info.append("output_format")
            
        if len(prompt_lower) < 50:  # 简短的提示词通常需要更多背景
            needed_info.append("context_background")
        
        if not any(word in prompt_lower for word in ["语调", "风格", "方式", "tone"]):
            needed_info.append("tone_style")
        
        # 确保至少有核心问题
        if not needed_info:
            needed_info = ["target_audience", "main_goal"]
        
        return needed_info
    
    def get_next_question(
        self, 
        original_prompt: str, 
        conversation_history: List[ConversationHistoryItem]
    ) -> CascadingQuestionResponse:
        """获取下一个问题"""
        
        # 分析已回答的问题
        answered_keys = set()
        for item in conversation_history:
            key = self._extract_question_key(item.question)
            if key != "unknown":
                answered_keys.add(key)
        
        # 分析提示词需要的信息
        needed_info = self.analyze_prompt_needs(original_prompt)
        
        # 过滤已回答的问题
        unanswered_needs = [key for key in needed_info if key not in answered_keys]
        
        # 根据对话历史决定是否需要追问
        follow_up_questions = self._get_follow_up_questions(conversation_history)
        unanswered_needs.extend(follow_up_questions)
        
        # 去重并按优先级排序
        unanswered_needs = list(dict.fromkeys(unanswered_needs))  # 去重保持顺序
        unanswered_needs.sort(key=lambda x: self.question_priorities.get(x, 999))
        
        # 判断是否还有问题需要问
        has_next = len(unanswered_needs) > 0
        can_finalize = len(conversation_history) >= 2  # 至少回答2个问题后可以结束
        
        if has_next:
            next_question_key = unanswered_needs[0]
            question_data = self.question_bank.get(next_question_key)
            
            if not question_data:
                # 如果问题库中没有，可能是动态生成的追问
                question_data = self._generate_dynamic_question(next_question_key, conversation_history)
        else:
            question_data = None
        
        # 计算进度
        total_needed = len(needed_info) + len(follow_up_questions)
        current_progress = len(conversation_history)
        
        return CascadingQuestionResponse(
            has_next_question=has_next,
            question=question_data,
            progress={
                "current": current_progress + 1 if has_next else current_progress,
                "estimated_total": max(total_needed, current_progress + (1 if has_next else 0))
            },
            can_finalize=can_finalize,
            reasoning=f"基于提示词分析，需要了解{len(unanswered_needs)}个方面的信息" if has_next else "已收集足够信息"
        )
    
    def _extract_question_key(self, question_text: str) -> str:
        """从问题文本中提取问题键"""
        # 精确匹配问题文本
        for key, question_data in self.question_bank.items():
            if question_data.question == question_text:
                return key
        
        # 如果精确匹配失败，尝试关键词匹配
        question_lower = question_text.lower()
        if "用户" in question_lower or "面向" in question_lower:
            return "target_audience"
        elif "目标" in question_lower or "目的" in question_lower:
            return "main_goal"
        elif "格式" in question_lower or "形式" in question_lower:
            return "output_format"
        elif "背景" in question_lower or "场景" in question_lower:
            return "context_background"
        elif "语调" in question_lower or "风格" in question_lower:
            return "tone_style"
        elif "技术" in question_lower or "水平" in question_lower:
            return "technical_level"
        elif "要求" in question_lower or "约束" in question_lower:
            return "specific_requirements"
        elif "示例" in question_lower or "案例" in question_lower:
            return "examples_needed"
        
        return "unknown"
    
    def _get_follow_up_questions(self, conversation_history: List[ConversationHistoryItem]) -> List[str]:
        """根据对话历史获取追问问题"""
        follow_ups = []
        
        for item in conversation_history:
            question_key = self._extract_question_key(item.question)
            answer_lower = item.answer.lower()
            
            # 基于回答内容决定追问
            if question_key == "target_audience":
                if "开发者" in answer_lower or "程序员" in answer_lower:
                    follow_ups.append("technical_level")
                elif "学生" in answer_lower or "研究" in answer_lower:
                    follow_ups.append("technical_level")
            
            elif question_key == "main_goal":
                if "学习" in answer_lower or "教学" in answer_lower:
                    follow_ups.append("examples_needed")
                elif "创作" in answer_lower or "生成" in answer_lower:
                    follow_ups.append("tone_style")
        
        return follow_ups
    
    def _generate_dynamic_question(self, question_key: str, conversation_history: List[ConversationHistoryItem]) -> QuestionData:
        """动态生成问题（用于处理问题库中没有的追问）"""
        # 这里可以根据对话历史动态生成问题
        return QuestionData(
            key=question_key,
            question=f"关于{question_key}，你能提供更多详细信息吗？",
            type="text",
            importance="medium",
            placeholder="请提供相关信息"
        )
    
    def should_continue_asking(self, conversation_history: List[ConversationHistoryItem]) -> bool:
        """判断是否应该继续提问"""
        # 基本规则：至少问2个问题，最多问6个问题
        min_questions = 2
        max_questions = 6
        
        current_count = len(conversation_history)
        
        if current_count < min_questions:
            return True
        elif current_count >= max_questions:
            return False
        else:
            # 中间状态，根据信息完整度决定
            return self._assess_information_completeness(conversation_history) < 0.8
    
    def _assess_information_completeness(self, conversation_history: List[ConversationHistoryItem]) -> float:
        """评估信息完整度（0-1之间）"""
        # 简单的完整度评估逻辑
        core_aspects = ["target_audience", "main_goal", "output_format"]
        answered_core = sum(1 for item in conversation_history 
                          if self._extract_question_key(item.question) in core_aspects)
        
        return min(answered_core / len(core_aspects), 1.0)