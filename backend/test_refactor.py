"""
简单的测试脚本，验证重构后的代码是否正常工作
"""
import sys
import os

# 添加app目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """测试所有模块是否能正常导入"""
    try:
        from app.config import get_settings
        from app.constants import SUPPORTED_MODELS, MODEL_INFO, META_PROMPT_TEMPLATE
        from app.models import PromptRequest, PromptResponse
        from app.services.llm_service import LLMService
        from app.services.prompt_service import PromptService
        from app.routers import health, models, optimize
        print("所有模块导入成功")
        return True
    except Exception as e:
        print(f"模块导入失败: {e}")
        return False

def test_config():
    """测试配置模块"""
    try:
        from app.config import get_settings
        settings = get_settings()
        print(f"✅ 配置加载成功: {settings.app_title}")
        return True
    except Exception as e:
        print(f"❌ 配置测试失败: {e}")
        return False

def test_constants():
    """测试常量模块"""
    try:
        from app.constants import SUPPORTED_MODELS, MODEL_INFO
        print(f"✅ 常量加载成功: 支持{len(SUPPORTED_MODELS)}个模型")
        return True
    except Exception as e:
        print(f"❌ 常量测试失败: {e}")
        return False

def test_models():
    """测试数据模型"""
    try:
        from app.models import PromptRequest, PromptResponse
        
        # 测试请求模型
        request = PromptRequest(original_prompt="测试提示词")
        print(f"✅ 请求模型创建成功: {request.model}")
        
        # 测试响应模型
        response = PromptResponse(optimized_prompt="优化后的提示词", model_used="deepseek-chat")
        print(f"✅ 响应模型创建成功: {response.model_used}")
        return True
    except Exception as e:
        print(f"❌ 数据模型测试失败: {e}")
        return False

def test_services():
    """测试服务模块"""
    try:
        from app.config import get_settings
        from app.services.llm_service import LLMService
        from app.services.prompt_service import PromptService
        
        settings = get_settings()
        llm_service = LLMService(settings)
        prompt_service = PromptService(settings)
        
        print("✅ 服务模块创建成功")
        return True
    except Exception as e:
        print(f"❌ 服务模块测试失败: {e}")
        return False

def main():
    """运行所有测试"""
    print("开始测试重构后的代码...")
    print("-" * 50)

    tests = [
        test_imports,
        test_config,
        test_constants,
        test_models,
        test_services
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("-" * 50)
    print(f"测试结果: {passed}/{total} 通过")

    if passed == total:
        print("所有测试通过！重构成功！")
        return True
    else:
        print("部分测试失败，请检查代码")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
