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
        text_stripped = text.rstrip()
        
        # 如果文本为空，认为被截断
        if not text_stripped:
            return True
        
        # 检查是否过长（超过50000字符可能存在异常，因为我们限制在30000字）
        if text_length > 50000:
            print(f"警告：回答异常过长 ({text_length} 字符)，超出预期范围")
            return True
        
        # 检查是否明显被截断的迹象
        indicator_names = [
            "以逗号结尾",
            "以连接词结尾", 
            "以省略号结尾",
            "极短文本无标点",
            "以助词结尾且文本短"
        ]
        
        truncation_indicators = [
            # 以逗号结尾（句子中断）
            text_stripped.endswith((',', '，')),
            # 以连接词结尾（明显未完成）
            text_stripped.endswith(('和', '或', '以及', '而且', '但是', '然而', '因此', '所以', '那么', '接下来', '首先', '其次', '然后')),
            # 以省略号结尾（明显不完整）
            text_stripped.endswith(('...', '…', '--', '——')),
            # 极短文本且不以标点结尾（可能被意外截断）
            (text_length < 50 and not text_stripped[-1:] in '.。!！?？:：;；'),
            # 以助词结尾且文本较短（可能不完整）
            (text_length < 500 and text_stripped.endswith(('的', '了', '在', '是', '有', '会', '能', '要', '可', '正', '将', '已', '被', '对', '把', '让', '使'))),
        ]
        
        # 计算触发的指标数量
        true_indicators = sum(truncation_indicators)
        
        # 调试信息：显示哪些检测指标被触发
        if true_indicators > 0:
            triggered = [indicator_names[i] for i, indicator in enumerate(truncation_indicators) if indicator]
            print(f"截断检测触发指标: {triggered}, 文本长度: {text_length}, 文本结尾: '{text_stripped[-30:]}'")
        
        # 更严格的判断标准：需要多个强烈指标才认为被截断
        if true_indicators >= 3:
            print(f"警告：检测到多个截断指标 ({true_indicators}个)，判定为被截断")
            return True
        elif true_indicators >= 2 and text_length < 200:
            print(f"警告：短文本检测到多个截断指标，判定为被截断")
            return True
        elif true_indicators >= 1 and text_length < 20:
            print(f"警告：极短文本检测到截断指标，判定为被截断")
            return True
        
        # 额外检查：API层面的截断（长文本突然结束，没有自然的结尾）
        if text_length > 3000:  # 对中等长度文本进行检查
            # 检查最后200个字符是否包含句子结尾标点
            last_200 = text_stripped[-200:]
            has_strong_ending = any(text_stripped.endswith(pattern) for pattern in [
                '。', '！', '？', '.', '!', '?',  # 强结尾标点
                '。\n', '！\n', '？\n', '.\n', '!\n', '?\n',  # 带换行的结尾
                '总结', '总之', '综上所述', '最后', '结论', '概括',  # 结论性词汇
                # 正式文档结尾
                '此致', '敬礼', '谢谢', '感谢', '祝好', '再见',
                # 商务邮件结尾
                '祝您', '祝你', '祝愿', '期待', '联系方式', '日期',
                # 签名结尾
                '[您的名字', '[您的', '[姓名', '[公司', '[联系',
                # 时间日期结尾
                '年', '月', '日'
            ])
            
            # 检查最后几个句子是否完整
            sentences_in_last_200 = len([char for char in last_200 if char in '。！？.!?'])
            
            # 检查最后500字符是否包含正式文档的结尾模式
            last_500 = text_stripped[-500:]
            has_formal_ending = any(pattern in last_500 for pattern in [
                '此致', '敬礼', '祝您', '祝你', '谢谢', '感谢',
                '[您的', '[姓名', '[公司', '[联系方式', '[日期',
                '生意兴隆', '工作顺利', '身体健康', '万事如意'
            ])
            
            # 检查是否以不完整的方式结尾
            ends_abruptly = (
                len(text_stripped) > 10 and
                not has_strong_ending and
                not has_formal_ending and  # 新增：检查正式文档结尾
                not text_stripped[-1].isspace() and  # 不是以空格结尾
                text_stripped[-1] not in ['，', ',', '；', ';', '：', ':', '、', ')', '。', '.', '！', '!', '？', '?', ']']  # 不是以标点结尾
            )
            
            # 额外检查：是否包含常见的未完成模式
            incomplete_patterns = [
                '另外', '此外', '同时', '接下来', '下面', '首先', '其次', '然后', 
                '关于', '对于', '针对', '基于', '根据', '通过', '利用',
                '例如', '比如', '譬如', '诸如', '包括', '涵盖',
                '另外还需要注意', '接下来我们来讨论', '关于这个问题的'
            ]
            
            ends_with_incomplete_pattern = any(
                text_stripped.endswith(pattern) for pattern in incomplete_patterns
            )
            
            if ends_abruptly or ends_with_incomplete_pattern:
                print(f"警告：长文本可能被截断")
                print(f"  - 强结尾: {has_strong_ending}")
                print(f"  - 正式文档结尾: {has_formal_ending}")
                print(f"  - 最后200字符句子数: {sentences_in_last_200}")
                print(f"  - 以未完成模式结尾: {ends_with_incomplete_pattern}")
                print(f"  - 最后100字符: {last_200[-100:]}")
                return True
        
        print(f"截断检测通过，文本完整性良好 (长度: {text_length})")
        return False
    
    
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
            
            # 使用特殊的API调用来获取finish_reason
            try:
                if model == "gemini-2.5-flash-lite-preview-06-17":
                    client = self.llm_service._create_gemini_quick_client()
                    api_response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.5,
                        max_tokens=max_tokens
                    )
                    response = api_response.choices[0].message.content.strip()
                    finish_reason = getattr(api_response.choices[0], 'finish_reason', None)
                    print(f"API响应完成原因: {finish_reason}")
                else:
                    response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=max_tokens)
                    finish_reason = None
            except Exception as e:
                # 如果特殊调用失败，回退到原来的方法
                print(f"特殊API调用失败，使用备用方法: {str(e)}")
                response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=max_tokens)
                finish_reason = None
            
            # 使用更严格的截断检测进行重试判断
            # 如果API正常结束(finish_reason='stop')且内容检测为完整，则不重试
            initial_truncated = self._check_if_truncated(response)
            api_finished_normally = (finish_reason == 'stop')
            
            should_retry = (
                initial_truncated and 
                max_tokens < 65000 and 
                not api_finished_normally  # 新增：API正常结束时不重试
            )
            
            if should_retry:
                print("初始响应被检测为截断，尝试使用更高token限制重新生成...")
                max_tokens = 65000  # 进一步增加token限制
            elif initial_truncated and api_finished_normally:
                print("内容检测为截断，但API正常结束(finish_reason=stop)，跳过重试")
            elif not initial_truncated:
                print("内容检测为完整，无需重试")
            
            if should_retry:
                try:
                    retry_response = await self.llm_service.call_llm_api_with_custom_tokens(model, messages, max_tokens=max_tokens)
                    print(f"重试完成，新响应长度: {len(retry_response)} 字符")
                    
                    # 检查重试后的回答是否更好
                    retry_truncated = self._check_if_truncated(retry_response)
                    if not retry_truncated or len(retry_response) > len(response):
                        print("重试响应更完整，使用重试结果")
                        response = retry_response
                    else:
                        print("重试响应仍有问题，保持原始响应")
                        
                except Exception as retry_error:
                    print(f"重试失败，使用原始响应: {str(retry_error)}")
                    # 继续使用原始响应
            
            if not response:
                print("错误：API返回空响应")
                raise HTTPException(
                    status_code=500,
                    detail="AI模型返回空响应"
                )
            
            print(f"API调用成功，原始响应长度: {len(response)} 字符")
            
            # 检查响应是否看起来被截断了
            if len(response) > 1000:  # 只对长回答进行检查
                # 检查最后100个字符中是否有完整句子的结尾
                last_100 = response[-100:]
                has_sentence_ending = any(char in last_100 for char in ['。', '！', '？', '.', '!', '?'])
                if not has_sentence_ending:
                    print(f"警告：响应可能被API截断，最后100字符: {last_100}")
                else:
                    print(f"响应看起来完整，最后100字符: {last_100}")
            
            # 硬性截断：如果响应过长，强制截断到合理长度（保持30,000字限制）
            if len(response) > 45000:  # 约30000字的字符数上限
                print(f"警告：响应过长 ({len(response)} 字符)，执行强制截断到30000字以内")
                # 找到最后一个完整句子的位置进行截断
                truncate_pos = 43000  # 保守截断位置，确保在30000字以内
                for i in range(42000, min(len(response), 45000)):
                    if response[i] in ['。', '！', '？', '.', '!', '?']:
                        truncate_pos = i + 1
                        break
                response = response[:truncate_pos]
                print(f"截断后长度: {len(response)} 字符")
            
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