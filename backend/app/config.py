"""
配置管理模块
处理环境变量加载和应用配置
"""
import os
from functools import lru_cache
from dotenv import load_dotenv


class Settings:
    """应用配置类"""

    def __init__(self):
        # API密钥
        self.my_llm_api_key = os.getenv("MY_LLM_API_KEY", "")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        # 新增的Gemini API密钥（用于快速回答功能）
        self.gemini_quick_api_key = os.getenv("GEMINI_QUICK_API_KEY", "AIzaSyA_QAQF2eBUl-kpX8_P1rmU7vvrakTFuJs")

        # Supabase配置
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")

        # API配置
        self.deepseek_base_url = "https://api.deepseek.com/v1"
        self.gemini_base_url = "https://www.chataiapi.com/v1"
        # 新的Gemini API基础URL（Google官方API）
        self.gemini_quick_base_url = "https://generativelanguage.googleapis.com/v1beta"

        # 应用配置
        self.app_title = "智优词 API"
        self.app_description = "一个用于优化提示词的API服务"
        self.app_version = "1.0.0"

        # CORS配置
        self.cors_origins = ["*"]
        self.cors_methods = ["*"]
        self.cors_headers = ["*"]

        # 频率限制配置
        self.rate_limit = os.getenv("RATE_LIMIT", "10/minute")


@lru_cache()
def get_settings() -> Settings:
    """获取应用配置（单例模式）"""
    # 加载环境变量
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    
    settings = Settings()
    
    # 调试：检查API密钥是否正确加载
    if not settings.my_llm_api_key:
        print("警告：MY_LLM_API_KEY 环境变量未设置或为空")
    else:
        print(f"DeepSeek API密钥已加载：{settings.my_llm_api_key[:10]}...")
    
    if not settings.gemini_api_key:
        print("警告：GEMINI_API_KEY 环境变量未设置或为空")
    else:
        print(f"Gemini API密钥已加载：{settings.gemini_api_key[:10]}...")
    
    if not settings.gemini_quick_api_key:
        print("警告：GEMINI_QUICK_API_KEY 环境变量未设置或为空")
    else:
        print(f"Gemini Quick API密钥已加载：{settings.gemini_quick_api_key[:10]}...")
    
    return settings
