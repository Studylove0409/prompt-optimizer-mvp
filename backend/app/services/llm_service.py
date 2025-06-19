"""
LLM API调用服务
处理与各种LLM API的交互
"""
from openai import OpenAI
import openai
from fastapi import HTTPException

from ..config import Settings
from ..constants import API_TIMEOUT, API_TEMPERATURE, API_MAX_TOKENS, API_MAX_TOKENS_THINKING


class LLMService:
    """LLM服务类"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
    
    def _create_deepseek_client(self) -> OpenAI:
        """创建DeepSeek客户端"""
        if not self.settings.my_llm_api_key:
            raise HTTPException(
                status_code=500,
                detail="DeepSeek API密钥未配置：请检查环境变量 MY_LLM_API_KEY 是否正确设置"
            )
        
        return OpenAI(
            api_key=self.settings.my_llm_api_key,
            base_url=self.settings.deepseek_base_url
        )
    
    def _create_gemini_client(self) -> OpenAI:
        """创建Gemini客户端"""
        if not self.settings.gemini_api_key:
            raise HTTPException(
                status_code=500,
                detail="Gemini API密钥未配置：请检查环境变量 GEMINI_API_KEY 是否正确设置"
            )
        
        return OpenAI(
            api_key=self.settings.gemini_api_key,
            base_url=self.settings.gemini_base_url
        )
    
    def _create_gemini_quick_client(self) -> OpenAI:
        """创建Gemini快速回答客户端（使用新的API密钥）"""
        if not self.settings.gemini_quick_api_key:
            raise HTTPException(
                status_code=500,
                detail="Gemini Quick API密钥未配置：请检查环境变量 GEMINI_QUICK_API_KEY 是否正确设置"
            )
        
        return OpenAI(
            api_key=self.settings.gemini_quick_api_key,
            base_url=self.settings.gemini_quick_base_url
        )
    
    def _create_system_message(self) -> str:
        """创建系统消息"""
        return ("你是一位顶级的AI提示词优化引擎。你的任务是分析用户提供的原始提示词，"
                "并将其改写得更清晰、更具体、结构更合理、信息更充分，以便任何AI模型都能更好地理解"
                "并给出高质量的回复。请直接返回优化后的提示词文本，不要包含任何额外的解释或对话。")
    
    async def call_deepseek_api(self, model: str, messages: list) -> str:
        """调用DeepSeek API"""
        try:
            client = self._create_deepseek_client()
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=False,
                temperature=API_TEMPERATURE,
                max_tokens=API_MAX_TOKENS
            )
            
            return response.choices[0].message.content.strip()
            
        except openai.APIConnectionError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API连接失败: {str(e)}"
            )
        except openai.RateLimitError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API速率限制: {str(e)}"
            )
        except openai.APIStatusError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API状态错误: {str(e)}"
            )
        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API调用失败: {str(e)}"
            )
    
    async def call_gemini_api(self, model: str, messages: list) -> str:
        """调用Gemini API"""
        try:
            client = self._create_gemini_client()
            
            print(f"使用Gemini模型: {model}")
            print(f"API密钥: {self.settings.gemini_api_key[:10]}...")
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=API_TEMPERATURE,
                max_tokens=API_MAX_TOKENS
            )
            
            # 处理响应
            if response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if message and message.content and message.content.strip():
                    optimized_prompt = message.content.strip()
                    print(f"Gemini响应成功，内容长度: {len(optimized_prompt)}")
                    return optimized_prompt
                else:
                    print(f"Gemini响应为空，模型: {model}")
                    # 对于快速回答功能，不使用备用模型以避免不一致的行为
                    # 只对提示词优化功能的某些模型使用备用处理
                    if model == "gemini-2.5-pro-preview-03-25":
                        print("尝试使用gemini-2.0-flash作为备用")
                        backup_response = client.chat.completions.create(
                            model="gemini-2.0-flash",
                            messages=messages,
                            temperature=API_TEMPERATURE,
                            max_tokens=API_MAX_TOKENS
                        )
                        if backup_response.choices and backup_response.choices[0].message.content:
                            optimized_prompt = backup_response.choices[0].message.content.strip()
                            print(f"备用模型响应成功，内容长度: {len(optimized_prompt)}")
                            return optimized_prompt
                        else:
                            raise HTTPException(
                                status_code=500,
                                detail="Gemini模型暂时无法处理此请求，请稍后重试或选择其他模型"
                            )
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail="Gemini API返回空响应，请稍后重试"
                        )
            else:
                print("Gemini响应格式错误")
                raise HTTPException(
                    status_code=500,
                    detail="Gemini API响应格式错误"
                )
                
        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini API调用失败: {str(e)}"
            )
    
    async def call_gemini_api_with_tokens(self, model: str, messages: list, max_tokens: int) -> str:
        """调用Gemini API（带自定义token限制）"""
        try:
            client = self._create_gemini_client()
            
            print(f"使用Gemini模型: {model}, max_tokens: {max_tokens}")
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=API_TEMPERATURE,
                max_tokens=max_tokens
            )
            
            # 处理响应
            if response.choices and len(response.choices) > 0:
                choice = response.choices[0]
                message = choice.message
                
                if message and message.content and message.content.strip():
                    optimized_prompt = message.content.strip()
                    print(f"Gemini响应成功，内容长度: {len(optimized_prompt)}")
                    return optimized_prompt
                else:
                    print(f"Gemini响应为空，模型: {model}")
                    # 对于快速回答功能，不使用备用模型以避免不一致的行为
                    # 只对提示词优化功能的某些模型使用备用处理
                    if model == "gemini-2.5-pro-preview-03-25":
                        print("尝试使用gemini-2.0-flash作为备用")
                        backup_response = client.chat.completions.create(
                            model="gemini-2.0-flash",
                            messages=messages,
                            temperature=API_TEMPERATURE,
                            max_tokens=max_tokens
                        )
                        if backup_response.choices and backup_response.choices[0].message.content:
                            optimized_prompt = backup_response.choices[0].message.content.strip()
                            print(f"备用模型响应成功，内容长度: {len(optimized_prompt)}")
                            return optimized_prompt
                        else:
                            raise HTTPException(
                                status_code=500,
                                detail="Gemini模型暂时无法处理此请求，请稍后重试或选择其他模型"
                            )
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail="Gemini API返回空响应，请稍后重试"
                        )
            else:
                print("Gemini响应格式错误")
                raise HTTPException(
                    status_code=500,
                    detail="Gemini API响应格式错误"
                )
                
        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini API调用失败: {str(e)}"
            )
    
    async def call_deepseek_api_with_tokens(self, model: str, messages: list, max_tokens: int) -> str:
        """调用DeepSeek API（带自定义token限制）"""
        try:
            client = self._create_deepseek_client()
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=False,
                temperature=API_TEMPERATURE,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content.strip()
            
        except openai.APIConnectionError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API连接失败: {str(e)}"
            )
        except openai.RateLimitError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API速率限制: {str(e)}"
            )
        except openai.APIStatusError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API状态错误: {str(e)}"
            )
        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeepSeek API调用失败: {str(e)}"
            )
    
    async def call_llm_api(self, model: str, messages: list) -> str:
        """统一的LLM API调用接口"""
        if model.startswith("gemini-"):
            return await self.call_gemini_api(model, messages)
        else:
            return await self.call_deepseek_api(model, messages)
    
    async def call_llm_api_thinking(self, model: str, messages: list) -> str:
        """思考模式专用的LLM API调用接口（使用更高的token限制）"""
        if model.startswith("gemini-"):
            return await self.call_gemini_api_with_tokens(model, messages, API_MAX_TOKENS_THINKING)
        else:
            return await self.call_deepseek_api_with_tokens(model, messages, API_MAX_TOKENS_THINKING)
    
    async def call_gemini_quick_api_with_tokens(self, model: str, messages: list, max_tokens: int) -> str:
        """调用Gemini Quick API（用于快速回答功能）"""
        try:
            client = self._create_gemini_quick_client()
            
            print(f"使用Gemini Quick模型: {model}, max_tokens: {max_tokens}")
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=API_TEMPERATURE,
                max_tokens=max_tokens
            )
            
            # 处理响应
            if response.choices and len(response.choices) > 0:
                choice = response.choices[0]
                message = choice.message
                
                if message and message.content and message.content.strip():
                    optimized_prompt = message.content.strip()
                    print(f"Gemini Quick响应成功，内容长度: {len(optimized_prompt)}")
                    return optimized_prompt
                else:
                    print(f"Gemini Quick响应为空，模型: {model}")
                    raise HTTPException(
                        status_code=500,
                        detail="Gemini Quick API返回空响应，请稍后重试"
                    )
            else:
                print("Gemini Quick响应格式错误")
                raise HTTPException(
                    status_code=500,
                    detail="Gemini Quick API响应格式错误"
                )
                
        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini Quick API调用失败: {str(e)}"
            )

    async def call_llm_api_with_custom_tokens(self, model: str, messages: list, max_tokens: int = API_MAX_TOKENS) -> str:
        """带自定义token限制的LLM API调用接口"""
        # 统一使用标准的API调用，不再使用Google官方API
        if model.startswith("gemini-"):
            return await self.call_gemini_api_with_tokens(model, messages, max_tokens)
        else:
            return await self.call_deepseek_api_with_tokens(model, messages, max_tokens)
    
    def create_messages(self, formatted_content: str) -> list:
        """创建消息列表（用于提示词优化，包含系统消息）"""
        return [
            {
                "role": "system",
                "content": self._create_system_message()
            },
            {
                "role": "user",
                "content": formatted_content
            }
        ]

